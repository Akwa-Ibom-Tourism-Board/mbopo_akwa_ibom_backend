import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { StatusCodes } from "../../configurations/statusCodes";
import { signComplaintAttachmentUpload } from "../../configurations/cloudinary";

const attachmentSignatureService = errorUtilities.withServiceErrorHandling(
  async (submissionId: string, slot: number) => {
    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Signature issued",
      signComplaintAttachmentUpload(submissionId, slot),
    );
  },
);

export default attachmentSignatureService;
