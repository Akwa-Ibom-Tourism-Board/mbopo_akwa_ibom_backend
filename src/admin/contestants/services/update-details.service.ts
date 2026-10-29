import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { User } from "../../../auth/User";
import { Application, ApplicationStatus } from "../../../applicants/application/Application";
import { normalizeDraftPayload } from "../../../applicants/application/application.helpers";
import { AdminRole } from "../../users/AdminUser";
import { serializeCandidateForViewer } from "../../helpers/candidate.helpers";
import { recordActivity } from "../../helpers/activity.helpers";

// Corrects part of a submitted application. Admin / Super Admin only
// (gated at the route via "candidates.editDetails"). Names, gender, date
// of birth, NIN, VIN and the profile photo come from the applicant's
// verified identity and are never touched here — this reuses the exact
// same field set and sentence-casing the applicant's own draft-save path
// uses (application.helpers.ts), just aimed at a submitted row instead of
// a draft one.
const updateDetailsService = errorUtilities.withServiceErrorHandling(
  async (actorId: string, viewerRole: AdminRole, applicationId: string, payload: Record<string, any>) => {
    const application = await Application.findByPk(applicationId);
    if (!application || application.get("status") !== ApplicationStatus.Submitted) {
      throw errorUtilities.createError("Contestant not found", StatusCodes.NOT_FOUND);
    }

    await application.update(normalizeDraftPayload(payload));

    const user = await User.findByPk(application.get("applicantId") as string);
    if (!user) {
      throw errorUtilities.createError("Contestant not found", StatusCodes.NOT_FOUND);
    }

    const fields = Object.keys(payload).join(", ");
    await recordActivity(
      actorId,
      "candidates",
      `Updated ${fields || "details"} on ${user.get("firstName")} ${user.get("lastName")}'s application`,
      [applicationId],
    );

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Details updated",
      serializeCandidateForViewer(user, application, viewerRole),
    );
  },
);

export default updateDetailsService;
