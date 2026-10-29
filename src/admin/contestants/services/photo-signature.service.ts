import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { User } from "../../../auth/User";
import { Application, ApplicationStatus } from "../../../applicants/application/Application";
import { signCandidatePhotoUpload, slugify } from "../../../configurations/cloudinary";

// Issues a signature for the NEXT additional-photo slot only — the index is
// derived server-side from how many photos the candidate already has, never
// taken from the client, so Media can't overwrite an existing photo by
// guessing its index.
const photoSignatureService = errorUtilities.withServiceErrorHandling(
  async (applicationId: string) => {
    const application = await Application.findByPk(applicationId);
    if (!application || application.get("status") !== ApplicationStatus.Submitted) {
      throw errorUtilities.createError("Contestant not found", StatusCodes.NOT_FOUND);
    }

    const user = await User.findByPk(application.get("applicantId") as string);
    if (!user) {
      throw errorUtilities.createError("Contestant not found", StatusCodes.NOT_FOUND);
    }

    const nameSlug = slugify(
      [user.get("firstName"), user.get("lastName")].filter(Boolean).join(" "),
    );
    const existingPhotos = (application.get("additionalPhotos") as string[] | null) ?? [];
    const index = existingPhotos.length;

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Signature issued",
      signCandidatePhotoUpload(application.get("applicantId") as string, nameSlug, index),
    );
  },
);

export default photoSignatureService;
