import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { User } from "../../../auth/User";
import { Application, ApplicationStatus } from "../../../applicants/application/Application";
import { signUpload, slugify, type PhotoField } from "../../../configurations/cloudinary";

// Admin / Super Admin replacing one of a contestant's own documents (not
// the Media profile-content path — see photo-signature.service.ts for
// that). Reuses the exact same signed-upload scheme the applicant's own
// upload flow uses (same deterministic public_id), so a replacement
// overwrites the original asset in place.
const documentSignatureService = errorUtilities.withServiceErrorHandling(
  async (applicationId: string, field: PhotoField) => {
    const application = await Application.findByPk(applicationId);
    if (!application || application.get("status") !== ApplicationStatus.Submitted) {
      throw errorUtilities.createError("Contestant not found", StatusCodes.NOT_FOUND);
    }

    const applicantId = application.get("applicantId") as string;
    const user = await User.findByPk(applicantId);
    if (!user) {
      throw errorUtilities.createError("Contestant not found", StatusCodes.NOT_FOUND);
    }

    const nameSlug = slugify([user.get("firstName"), user.get("lastName")].filter(Boolean).join(" "));

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Signature issued",
      signUpload(applicantId, field, nameSlug),
    );
  },
);

export default documentSignatureService;
