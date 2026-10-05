import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { StatusCodes } from "../../configurations/statusCodes";
import { signUpload, UploadField } from "../../configurations/cloudinary";
import { User } from "../../auth/User";
import { Application, ApplicationStatus } from "../../applicants/application/Application";
import {
  SUBMITTED_ERROR,
  UNVERIFIED_ERROR,
} from "../../applicants/application/application.helpers";
import {
  PHOTO_FIELD_TO_COLUMNS,
  VIDEO_LOCKED_ERROR,
} from "../../applicants/application/services/upload-photo.service";

const cloudinarySignatureService = errorUtilities.withServiceErrorHandling(
  async (applicantId: string, field: UploadField) => {
    // Fail-fast gate so a client never wastes an upload. It's advisory:
    // the save endpoint re-checks everything under a row lock.
    if (field === "avatar") {
      // Never issue a signature that could overwrite the NIN-sourced photo
      // sitting at the deterministic avatar public_id.
      const user = await User.findByPk(applicantId, { attributes: ["id", "identityVerified"] });
      if (!user) {
        throw errorUtilities.createError("User not found", StatusCodes.NOT_FOUND);
      }
      if (user.get("identityVerified")) {
        throw errorUtilities.createError(
          "Your profile photo is set from your verified NIN and can't be changed",
          StatusCodes.FORBIDDEN,
        );
      }
    } else {
      const application = await Application.findOne({ where: { applicantId } });

      if (application) {
        if (application.get("status") !== ApplicationStatus.Draft) {
          throw errorUtilities.createError(SUBMITTED_ERROR, StatusCodes.CONFLICT);
        }
        if (
          field === "videoPitch" &&
          application.get(PHOTO_FIELD_TO_COLUMNS.videoPitch.url as any)
        ) {
          throw errorUtilities.createError(VIDEO_LOCKED_ERROR, StatusCodes.CONFLICT);
        }
      } else {
        const applicant = await User.findByPk(applicantId);
        if (!applicant?.get("identityVerified")) {
          throw errorUtilities.createError(UNVERIFIED_ERROR, StatusCodes.FORBIDDEN);
        }
      }
    }

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Signature issued",
      signUpload(applicantId, field),
    );
  },
);

export default cloudinarySignatureService;
