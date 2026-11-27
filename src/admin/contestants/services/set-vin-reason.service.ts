import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { User } from "../../../auth/User";
import { Application, ApplicationStatus } from "../../../applicants/application/Application";
import { AdminRole } from "../../users/AdminUser";
import { serializeCandidateForViewer } from "../../helpers/candidate.helpers";
import { recordActivity } from "../../helpers/activity.helpers";

/**
 * A manual override of the reason text next to an unverified VIN — e.g. to
 * replace an automated reason with a clearer note after checking by hand,
 * or to record why a contestant with no VIN at all is being left that way.
 * Deliberately doesn't touch isVinVerified itself: that stays driven by the
 * automated check (see vin-verification-queue.ts) or a retry of it — this
 * only edits the explanatory text alongside it.
 */
const setVinReasonService = errorUtilities.withServiceErrorHandling(
  async (actorId: string, viewerRole: AdminRole, applicationId: string, reason: string | null) => {
    const application = await Application.findByPk(applicationId);
    if (!application || application.get("status") !== ApplicationStatus.Submitted) {
      throw errorUtilities.createError("Contestant not found", StatusCodes.NOT_FOUND);
    }

    const applicantId = application.get("applicantId") as string;
    const user = await User.findByPk(applicantId);
    if (!user) {
      throw errorUtilities.createError("Contestant not found", StatusCodes.NOT_FOUND);
    }

    await user.update({ vinVerificationFailedReason: reason });

    await recordActivity(
      actorId,
      "candidates",
      reason
        ? `Set VIN note for ${user.get("firstName")} ${user.get("lastName")}: "${reason}"`
        : `Cleared VIN note for ${user.get("firstName")} ${user.get("lastName")}`,
      [applicationId],
    );

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "VIN note updated",
      serializeCandidateForViewer(user, application, viewerRole),
    );
  },
);

export default setVinReasonService;
