import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { database } from "../../../configurations/database";
import { assertValidUploadReference, PhotoField } from "../../../configurations/cloudinary";
import { lockOrCreateDraft } from "../application.helpers";

export const PHOTO_FIELD_TO_COLUMNS: Record<PhotoField, { url: string; publicId: string }> = {
  certificateOfOrigin: { url: "certificateOfOriginUrl", publicId: "certificateOfOriginPublicId" },
  fullImage: { url: "fullImageUrl", publicId: "fullImagePublicId" },
  fullImage2: { url: "fullImageUrl2", publicId: "fullImagePublicId2" },
  videoPitch: { url: "videoPitchUrl", publicId: "videoPitchPublicId" },
};

export const VIDEO_LOCKED_ERROR =
  "Your video pitch has already been submitted and can't be changed";

const uploadPhotoService = errorUtilities.withServiceErrorHandling(
  async (
    applicantId: string,
    input: { field: PhotoField; url: string; publicId: string },
  ) => {
    const { field, url, publicId } = input;

    // Pure check, no DB — fail before taking any lock.
    assertValidUploadReference(applicantId, field, url, publicId);

    const columns = PHOTO_FIELD_TO_COLUMNS[field];

    // The status / identity / video-lock checks and the write happen under
    // one row lock, so a concurrent submit or a second video-pitch save
    // can't slip between the check and the update.
    await database.transaction(async (transaction) => {
      const { application } = await lockOrCreateDraft(applicantId, transaction);

      if (field === "videoPitch" && application.get(columns.url as any)) {
        throw errorUtilities.createError(VIDEO_LOCKED_ERROR, StatusCodes.CONFLICT);
      }

      await application.update(
        { [columns.url]: url, [columns.publicId]: publicId },
        { transaction },
      );
    });

    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Photo uploaded", {
      field,
      url,
    });
  },
);

export default uploadPhotoService;
