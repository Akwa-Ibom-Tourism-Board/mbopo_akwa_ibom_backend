import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { User } from "../../../auth/User";
import { Application, ApplicationStatus } from "../../../applicants/application/Application";
import { assertValidUploadReference, type PhotoField } from "../../../configurations/cloudinary";
import { AdminRole } from "../../users/AdminUser";
import { serializeCandidateForViewer } from "../../helpers/candidate.helpers";
import { recordActivity } from "../../helpers/activity.helpers";

const FIELD_TO_COLUMNS: Record<PhotoField, { url: string; publicId: string }> = {
  certificateOfOrigin: { url: "certificateOfOriginUrl", publicId: "certificateOfOriginPublicId" },
  fullImage: { url: "fullImageUrl", publicId: "fullImagePublicId" },
  fullImage2: { url: "fullImageUrl2", publicId: "fullImagePublicId2" },
  videoPitch: { url: "videoPitchUrl", publicId: "videoPitchPublicId" },
};

const DOCUMENT_LABELS: Record<PhotoField, string> = {
  certificateOfOrigin: "certificate of origin",
  fullImage: "first full-length photo",
  fullImage2: "second full-length photo",
  videoPitch: "video pitch",
};

const saveDocumentService = errorUtilities.withServiceErrorHandling(
  async (
    actorId: string,
    viewerRole: AdminRole,
    applicationId: string,
    input: { field: PhotoField; url: string; publicId: string },
  ) => {
    const application = await Application.findByPk(applicationId);
    if (!application || application.get("status") !== ApplicationStatus.Submitted) {
      throw errorUtilities.createError("Contestant not found", StatusCodes.NOT_FOUND);
    }

    const applicantId = application.get("applicantId") as string;
    assertValidUploadReference(applicantId, input.field, input.url, input.publicId);

    const columns = FIELD_TO_COLUMNS[input.field];
    await application.update({ [columns.url]: input.url, [columns.publicId]: input.publicId });

    const user = await User.findByPk(applicantId);
    if (!user) {
      throw errorUtilities.createError("Contestant not found", StatusCodes.NOT_FOUND);
    }

    await recordActivity(
      actorId,
      "candidates",
      `Replaced the ${DOCUMENT_LABELS[input.field]} of ${user.get("firstName")} ${user.get("lastName")}`,
      [applicationId],
    );

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Document updated",
      serializeCandidateForViewer(user, application, viewerRole),
    );
  },
);

export default saveDocumentService;
