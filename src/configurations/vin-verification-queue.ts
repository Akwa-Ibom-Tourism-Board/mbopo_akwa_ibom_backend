import Queue from "bull";
import { UniqueConstraintError } from "sequelize";
import configurations from ".";
import { StatusCodes } from "./statusCodes";
import verifyVIN from "./vin-provider";
import { namesMatch } from "../auth/name-match";
import { User } from "../auth/User";

// VIN verification no longer blocks submission (see submit.service.ts) — an
// application goes straight to "submitted" with isVinVerified left at its
// default null ("not checked yet"), and this queue verifies the VIN
// afterwards, out of band. Mirrors email-queue.ts's Bull setup exactly.
const VIN_VERIFICATION_WORKER_CONCURRENCY = 3;

if (!configurations.REDIS_URL) {
  console.error("❌ REDIS_URL is not set — queued VIN verifications will never run");
}

const vinVerificationQueue = new Queue(
  "vin verification queue",
  configurations.REDIS_URL!,
  {
    settings: {
      // See email-queue.ts's identical setting for why this is 30s and not
      // Bull's 1s default: idle polling cost against the Redis plan's
      // command quota, not responsiveness — jobs here have no delay and
      // fire immediately regardless of this guard interval.
      guardInterval: 30_000,
    },
  },
);

vinVerificationQueue.on("error", (error) =>
  console.error("VIN verification queue error:", error.message),
);
vinVerificationQueue.on("ready", () =>
  console.log("🪪 VIN verification queue connected to Redis"),
);

export const VIN_NOT_FOUND_REASON =
  "VIN not found. Please ensure your VIN is correct — an unverified VIN may lead to disqualification.";
export const VIN_NAME_MISMATCH_REASON = "VIN name does not match the verified NIN name";
export const VIN_TAKEN_REASON = "This VIN is already registered to another account";
export const VIN_SERVICE_UNAVAILABLE_REASON =
  "The VIN verification service was unavailable after several attempts — needs a manual check";

export interface VinVerificationJobData {
  applicantId: string;
  vin: string;
}

export const queueVinVerification = async (data: VinVerificationJobData): Promise<void> => {
  vinVerificationQueue
    .add("verifyVin", data, {
      attempts: 5,
      backoff: { type: "exponential", delay: 5_000 },
      removeOnComplete: true,
      removeOnFail: true,
    })
    .then((job) => console.log(`VIN verification job ${job.id} queued for ${data.applicantId}`))
    .catch((error) => console.error("Failed to queue VIN verification:", error.message));
};

// A terminal (non-retryable) outcome: the VIN format is fine but DVP has
// definitively said no (not found) or the record conflicts with another
// account. Recorded immediately — retrying the identical VIN would never
// produce a different answer, unlike a transient DVP outage.
const recordTerminalOutcome = async (applicantId: string, reason: string) =>
  User.update(
    { isVinVerified: false, vinVerificationFailedReason: reason },
    { where: { id: applicantId } },
  );

vinVerificationQueue.process("verifyVin", VIN_VERIFICATION_WORKER_CONCURRENCY, async (job) => {
  const { applicantId, vin } = job.data as VinVerificationJobData;

  let vinResult;
  try {
    vinResult = await verifyVIN(vin);
  } catch (error: any) {
    if (error?.isOperational && error.statusCode === StatusCodes.BAD_REQUEST) {
      // DVP has definitively said this VIN does not exist — not a transient
      // failure, so don't let Bull retry it.
      await recordTerminalOutcome(applicantId, VIN_NOT_FOUND_REASON);
      return;
    }
    // Anything else (DVP down, timeout, our own config issue) is transient —
    // rethrow so Bull retries with backoff; see the "failed" handler below
    // for what happens once attempts are exhausted.
    throw error;
  }

  const user = await User.findByPk(applicantId);
  if (!user) return; // Account was deleted between submit and this job running.

  const matches = namesMatch(
    {
      firstName: user.get("firstName") as string | null,
      middleName: user.get("middleName") as string | null,
      lastName: user.get("lastName") as string | null,
    },
    { firstName: vinResult.firstName, lastName: vinResult.lastName },
  );

  if (!matches) {
    await recordTerminalOutcome(applicantId, VIN_NAME_MISMATCH_REASON);
    return;
  }

  try {
    await User.update(
      { isVinVerified: true, vinVerificationFailedReason: null, vin },
      { where: { id: applicantId } },
    );
  } catch (error) {
    if (error instanceof UniqueConstraintError && error.fields && "vin" in error.fields) {
      // Another account already owns this exact VIN as its own verified one.
      await recordTerminalOutcome(applicantId, VIN_TAKEN_REASON);
      return;
    }
    throw error;
  }
});

vinVerificationQueue.on("completed", (job) => {
  console.log(`VIN verification job ${job.id} completed`);
});

vinVerificationQueue.on("failed", (job, err) => {
  console.error(`VIN verification job ${job?.id} failed: ${err.message}`);
  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    const { applicantId } = job.data as VinVerificationJobData;
    recordTerminalOutcome(applicantId, VIN_SERVICE_UNAVAILABLE_REASON).catch((updateError) =>
      console.error("Failed to record exhausted VIN verification outcome:", updateError.message),
    );
  }
});

export default {
  queueVinVerification,
};
