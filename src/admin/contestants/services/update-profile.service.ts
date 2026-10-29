import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { User } from "../../../auth/User";
import { Application, ApplicationStatus } from "../../../applicants/application/Application";
import { assertValidCandidatePhotoUrl } from "../../../configurations/cloudinary";
import { AdminRole } from "../../users/AdminUser";
import { serializeCandidateForViewer } from "../../helpers/candidate.helpers";

export interface ProfileUpdateInput {
  bio?: string | null;
  additionalPhotos?: string[];
  additionalVideos?: { title: string; youtubeUrl: string }[];
}

// Whole-value replace per field present in the body (matching
// mbopo_akwa_ibom_admin_frontend's updateCandidateProfile) — a field left
// out of the request is left untouched, but a field that IS present
// replaces its entire array, it doesn't merge into the existing one.
const updateProfileService = errorUtilities.withServiceErrorHandling(
  async (viewerRole: AdminRole, applicationId: string, input: ProfileUpdateInput) => {
    const application = await Application.findByPk(applicationId);
    if (!application || application.get("status") !== ApplicationStatus.Submitted) {
      throw errorUtilities.createError("Contestant not found", StatusCodes.NOT_FOUND);
    }

    const applicantId = application.get("applicantId") as string;
    if (input.additionalPhotos) {
      for (const url of input.additionalPhotos) {
        assertValidCandidatePhotoUrl(applicantId, url);
      }
    }

    const patch: Record<string, unknown> = {};
    if (input.bio !== undefined) patch.bio = input.bio;
    if (input.additionalPhotos !== undefined) patch.additionalPhotos = input.additionalPhotos;
    if (input.additionalVideos !== undefined) patch.additionalVideos = input.additionalVideos;

    await application.update(patch);

    const user = await User.findByPk(applicantId);
    if (!user) {
      throw errorUtilities.createError("Contestant not found", StatusCodes.NOT_FOUND);
    }

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Profile updated",
      serializeCandidateForViewer(user, application, viewerRole),
    );
  },
);

export default updateProfileService;
