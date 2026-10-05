import crypto from "crypto";
import { UniqueConstraintError } from "sequelize";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { database } from "../../../configurations/database";
import { Application, ApplicationStatus } from "../Application";
import { findApplicationForUpdate, normalizeDraftPayload } from "../application.helpers";
import verifyVIN from "../../../configurations/vin-provider";
import { namesMatch } from "../../../auth/name-match";
import { queueEmail } from "../../../configurations/email-queue";
import { User } from "../../../auth/User";
import { applicationSubmittedTemplate } from "../emailTemplates/applicationSubmitted";
import { applicationSubmitSchema } from "../application.routes";
import { createNotification } from "../../../notifications/services/create.service";
import { NotificationType } from "../../../notifications/Notification";

const generateReferenceCode = (): string => {
  const year = new Date().getFullYear();
  const digits = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  return `MAI-${year}-${digits}`;
};

const MAX_REFERENCE_CODE_ATTEMPTS = 5;

const VIN_UNVERIFIED_MESSAGE = "We couldn't verify your VIN. Please check it and try again.";
const VIN_TAKEN_MESSAGE = "This VIN is already registered to another account.";
const VIN_NAME_MISMATCH_REASON = "VIN name does not match the verified NIN name";

const assertComplete = (application: Application) => {
  const { error } = applicationSubmitSchema.validate(application.toJSON(), {
    abortEarly: false,
    stripUnknown: true,
    allowUnknown: true,
  });

  if (error) {
    const missingFields = error.details.map((detail) => detail.message.replace(/["\\]/g, ""));
    throw errorUtilities.createError(
      `Application is incomplete: ${missingFields.join("; ")}`,
      StatusCodes.BAD_REQUEST,
    );
  }
};

const assertDraftApplication = (application: Application | null): Application => {
  if (!application) {
    throw errorUtilities.createError("No draft application found", StatusCodes.NOT_FOUND);
  }
  if (application.get("status") !== ApplicationStatus.Draft) {
    throw errorUtilities.createError(
      "This application has already been submitted",
      StatusCodes.CONFLICT,
    );
  }
  return application;
};

/**
 * Transaction 1 (short): lock, status checks, merge the body, validate the
 * merged row. Commits on success, releasing the row lock BEFORE any network
 * call. Returns the VIN to verify.
 */
const validateDraft = (applicantId: string, payload: Record<string, any>) =>
  database.transaction(async (transaction) => {
    const application = assertDraftApplication(
      await findApplicationForUpdate(applicantId, transaction),
    );

    if (Object.keys(payload).length > 0) {
      await application.update(normalizeDraftPayload(payload), { transaction });
    }

    assertComplete(application);
    return application.get("vin") as string;
  });

/**
 * Between transactions, no lock held: asks the DVP whether the VIN exists
 * (can take up to the client's 15s timeout) and whether its name matches the
 * already-NIN-verified account name.
 *  - VIN not found -> blocks submission (400)
 *  - DVP down      -> re-thrown as the 503 it is, never "your VIN is wrong"
 *  - found         -> { nameMatches }, which only decides what is recorded
 */
const checkVin = async (applicantId: string, vin: string): Promise<{ nameMatches: boolean }> => {
  const user = await User.findByPk(applicantId);
  if (!user) {
    throw errorUtilities.createError("User not found", StatusCodes.NOT_FOUND);
  }

  let vinResult;
  try {
    vinResult = await verifyVIN(vin);
  } catch (error: any) {
    if (error?.isOperational && error.statusCode === StatusCodes.BAD_REQUEST) {
      throw errorUtilities.createError(VIN_UNVERIFIED_MESSAGE, StatusCodes.BAD_REQUEST);
    }
    throw error;
  }

  return {
    nameMatches: namesMatch(
      {
        firstName: user.get("firstName") as string | null,
        middleName: user.get("middleName") as string | null,
        lastName: user.get("lastName") as string | null,
      },
      { firstName: vinResult.firstName, lastName: vinResult.lastName },
    ),
  };
};

/**
 * Transaction 2: re-lock, re-check (a second tab may have submitted, or the
 * draft may have been edited while the DVP call was in flight), then record
 * the VIN outcome on the User and flip the application — all or nothing.
 */
const finalizeSubmission = (applicantId: string, vin: string, nameMatches: boolean) =>
  database.transaction(async (transaction) => {
    const application = assertDraftApplication(
      await findApplicationForUpdate(applicantId, transaction),
    );

    // The VIN we verified must still be the one on the application, and the
    // row must still be complete.
    if (application.get("vin") !== vin) {
      throw errorUtilities.createError(
        "Your application changed while it was being submitted. Please review it and submit again.",
        StatusCodes.CONFLICT,
      );
    }
    assertComplete(application);

    // Judges-only outcome. A mismatch never blocks, and an unverified VIN is
    // never linked to the account's unique `vin` column.
    await User.update(
      nameMatches
        ? { isVinVerified: true, vinVerificationFailedReason: null, vin }
        : { isVinVerified: false, vinVerificationFailedReason: VIN_NAME_MISMATCH_REASON },
      { where: { id: applicantId }, transaction },
    );

    const referenceCode = generateReferenceCode();

    // Belt and braces with the row lock: the conditional WHERE status =
    // "draft" is the database-level guarantee that only one submit wins.
    // See BUILD_ME.md §10.
    const [affectedCount] = await Application.update(
      {
        status: ApplicationStatus.Submitted,
        referenceCode,
        submittedAt: new Date(),
      },
      { where: { applicantId, status: ApplicationStatus.Draft }, transaction },
    );

    if (affectedCount === 0) {
      throw errorUtilities.createError(
        "This application has already been submitted",
        StatusCodes.CONFLICT,
      );
    }

    await application.reload({ transaction });
    return { application, referenceCode };
  });

const submitService = errorUtilities.withServiceErrorHandling(
  async (applicantId: string, payload: Record<string, any>) => {
    const vin = await validateDraft(applicantId, payload);
    const { nameMatches } = await checkVin(applicantId, vin);

    let result: Awaited<ReturnType<typeof finalizeSubmission>> | undefined;

    // The 6-digit reference code is random, so a (rare) collision on its
    // unique index rolls the transaction back; retry with a fresh code. The
    // DVP call is not repeated.
    for (let attempt = 1; !result; attempt++) {
      try {
        result = await finalizeSubmission(applicantId, vin, nameMatches);
      } catch (error) {
        if (error instanceof UniqueConstraintError) {
          if (error.fields && "vin" in error.fields) {
            // Another account already owns this verified VIN. Distinct from
            // "not found" on purpose; the whole transaction rolled back, so
            // the application is still a draft.
            throw errorUtilities.createError(VIN_TAKEN_MESSAGE, StatusCodes.BAD_REQUEST);
          }
          if (
            error.fields &&
            "referenceCode" in error.fields &&
            attempt < MAX_REFERENCE_CODE_ATTEMPTS
          ) {
            continue;
          }
        }
        throw error;
      }
    }

    // Outside the transaction on purpose: createNotification swallows its
    // own errors, and a failed INSERT inside a Postgres transaction would
    // abort it. Only fire once the submit has durably committed.
    await createNotification({
      userId: applicantId,
      title: "Application submitted",
      body: `Your Mbopo Akwa Ibom application was submitted successfully. Your reference code is ${result.referenceCode}.`,
      type: NotificationType.Application,
    });

    // Confirmation email — best-effort like the notification: the
    // application is already submitted, so nothing here may fail the request.
    try {
      const applicant = await User.findByPk(applicantId, {
        attributes: ["email", "firstName"],
      });
      if (applicant) {
        const template = applicationSubmittedTemplate(
          (applicant.get("firstName") as string | null) ?? null,
          result.referenceCode,
        );
        await queueEmail({
          to: applicant.get("email") as string,
          subject: template.subject,
          htmlBody: template.htmlBody,
        });
      }
    } catch (error: any) {
      console.error("Failed to queue submission email:", error.message);
    }

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Application submitted",
      result.application,
    );
  },
);

export default submitService;
