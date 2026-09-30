import fs from "fs";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import {
  buildFileUrl,
  isMimetypeAllowedForField,
} from "../../../configurations/upload";
import { User } from "../../../auth/User";
import { Application, ApplicationStatus } from "../Application";

type PhotoField =
  | "passportPhoto"
  | "certificateOfOrigin"
  | "fullImage"
  | "fullImage2"
  | "videoPitch";

const PHOTO_FIELD_TO_COLUMN: Record<PhotoField, string> = {
  passportPhoto: "passportPhotoUrl",
  certificateOfOrigin: "certificateOfOriginUrl",
  fullImage: "fullImageUrl",
  fullImage2: "fullImageUrl2",
  videoPitch: "videoPitchUrl",
};

const FIELD_ERROR_MESSAGES: Partial<Record<PhotoField, string>> = {
  certificateOfOrigin: "Certificate of origin must be a JPEG, PNG, or PDF file",
  videoPitch: "Video pitch must be a WebM or MP4 file",
};

const uploadPhotoService = errorUtilities.withServiceErrorHandling(
  async (applicantId: string, field: PhotoField, file: Express.Multer.File) => {
    if (!isMimetypeAllowedForField(field, file.mimetype)) {
      fs.unlink(file.path, () => {});
      throw errorUtilities.createError(
        FIELD_ERROR_MESSAGES[field] ?? "Photo must be a JPEG or PNG image",
        StatusCodes.BAD_REQUEST,
      );
    }

    let application = await Application.findOne({ where: { applicantId } });

    if (application && application.get("status") !== ApplicationStatus.Draft) {
      fs.unlink(file.path, () => {});
      throw errorUtilities.createError(
        "This application has already been submitted and can no longer be edited",
        StatusCodes.CONFLICT,
      );
    }

    // The video pitch is the one field that isn't freely re-editable while
    // still a Draft — every other photo can be replaced any number of
    // times, but once a video pitch has been uploaded it's locked in for
    // good. See application.routes.ts's draftFieldSchema comment.
    if (field === "videoPitch" && application?.get("videoPitchUrl")) {
      fs.unlink(file.path, () => {});
      throw errorUtilities.createError(
        "Your video pitch has already been submitted and can't be changed",
        StatusCodes.CONFLICT,
      );
    }

    const url = buildFileUrl(file.filename);
    const column = PHOTO_FIELD_TO_COLUMN[field];

    if (!application) {
      // Defense in depth — the dashboard gates this behind the NIN/VIN
      // identity check client-side, but a direct API call must be stopped
      // here too: no application row can be started for an applicant who
      // hasn't verified.
      const applicant = await User.findByPk(applicantId);
      if (!applicant?.get("identityVerified")) {
        fs.unlink(file.path, () => {});
        throw errorUtilities.createError(
          "Please verify your NIN and VIN before starting your application",
          StatusCodes.FORBIDDEN,
        );
      }

      application = await Application.create({
        applicantId,
        status: ApplicationStatus.Draft,
        [column]: url,
      } as any);
    } else {
      await application.update({ [column]: url });
    }

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Photo uploaded",
      {
        field,
        url,
      },
    );
  },
);

export default uploadPhotoService;
