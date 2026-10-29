import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { getOrCreatePhaseState } from "../../helpers/phase-state.helpers";
import { PHASES } from "../../judging/phases.config";

const getPhaseStatesService = errorUtilities.withServiceErrorHandling(async () => {
  const states = await Promise.all(PHASES.map((p) => getOrCreatePhaseState(p.id)));

  return responseUtilities.handleServicesResponse(StatusCodes.OK, "Phase states fetched", states);
});

export default getPhaseStatesService;
