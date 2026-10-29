import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { signVotingContentUpload, type VotingContentScope } from "../../../configurations/cloudinary";

const uploadSignatureService = errorUtilities.withServiceErrorHandling(
  async (scope: VotingContentScope, id: string, slot: string) => {
    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Signature issued",
      signVotingContentUpload(scope, id, slot),
    );
  },
);

export default uploadSignatureService;
