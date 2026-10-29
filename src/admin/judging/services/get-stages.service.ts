import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { STAGES } from "../stages.config";

const getStagesService = errorUtilities.withServiceErrorHandling(async () => {
  return responseUtilities.handleServicesResponse(StatusCodes.OK, "Stages fetched", STAGES);
});

export default getStagesService;
