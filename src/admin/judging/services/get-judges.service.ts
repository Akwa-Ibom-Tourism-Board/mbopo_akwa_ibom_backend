import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { countedJudges } from "../../helpers/phase-state.helpers";
import type { PhaseId } from "../phases.config";

const getJudgesService = errorUtilities.withServiceErrorHandling(async (phase: PhaseId) => {
  const judges = await countedJudges(phase);
  return responseUtilities.handleServicesResponse(StatusCodes.OK, "Judges fetched", judges);
});

export default getJudgesService;
