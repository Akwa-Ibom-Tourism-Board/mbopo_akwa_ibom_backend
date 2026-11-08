import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { User } from "../../../auth/User";
import { Application, ApplicationStatus } from "../../../applicants/application/Application";
import { queueVinVerification } from "../../../configurations/vin-verification-queue";
import { AdminRole } from "../../users/AdminUser";
import { serializeCandidateForViewer } from "../../helpers/candidate.helpers";
import { recordActivity } from "../../helpers/activity.helpers";

// For the "VIN verification service was unavailable after several
// attempts" case mainly (see vin-verification-queue.ts), but works for any
// outcome — re-runs the same background check submit.service.ts queues
// automatically, against the VIN on file, without re-opening the
// application for editing.
const retryVinVerificationService = errorUtilities.withServiceErrorHandling(
  async (actorId: string, viewerRole: AdminRole, applicationId: string) => {
    const application = await Application.findByPk(applicationId);
    if (!application || application.get("status") !== ApplicationStatus.Submitted) {
      throw errorUtilities.createError("Contestant not found", StatusCodes.NOT_FOUND);
    }

    const vin = application.get("vin") as string | null;
    if (!vin) {
      throw errorUtilities.createError("This contestant has no VIN on file", StatusCodes.BAD_REQUEST);
    }

    const applicantId = application.get("applicantId") as string;
    const user = await User.findByPk(applicantId);
    if (!user) {
      throw errorUtilities.createError("Contestant not found", StatusCodes.NOT_FOUND);
    }

    await user.update({ isVinVerified: null, vinVerificationFailedReason: null });
    await queueVinVerification({ applicantId, vin });

    await recordActivity(
      actorId,
      "candidates",
      `Retried VIN verification for ${user.get("firstName")} ${user.get("lastName")}`,
      [applicationId],
    );

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "VIN verification queued again",
      serializeCandidateForViewer(user, application, viewerRole),
    );
  },
);

export default retryVinVerificationService;
