import fs from "fs";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import {
  buildFileUrl,
  isMimetypeAllowedForField,
} from "../../../configurations/upload";
import { Application, ApplicationStatus } from "../Application";

type PhotoField = "passportPhoto" | "certificateOfOrigin" | "fullImage";

const PHOTO_FIELD_TO_COLUMN: Record<PhotoField, string> = {
  passportPhoto: "passportPhotoUrl",
  certificateOfOrigin: "certificateOfOriginUrl",
  fullImage: "fullImageUrl",
};

const uploadPhotoService = errorUtilities.withServiceErrorHandling(
  async (applicantId: string, field: PhotoField, file: Express.Multer.File) => {
    if (!isMimetypeAllowedForField(field, file.mimetype)) {
      fs.unlink(file.path, () => {});
      throw errorUtilities.createError(
        field === "certificateOfOrigin"
          ? "Certificate of origin must be a JPEG, PNG, or PDF file"
          : "Photo must be a JPEG or PNG image",
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

    const url = buildFileUrl(file.filename);
    const column = PHOTO_FIELD_TO_COLUMN[field];

    if (!application) {
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
