import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { getOrCreatePhaseState, serializePhaseStates } from "../../helpers/phase-state.helpers";
import { PHASES } from "../../judging/phases.config";

const getPhaseStatesService = errorUtilities.withServiceErrorHandling(async () => {
  const states = await Promise.all(PHASES.map((p) => getOrCreatePhaseState(p.id)));
  const serialized = await serializePhaseStates(states);

  return responseUtilities.handleServicesResponse(StatusCodes.OK, "Phase states fetched", serialized);
});

export default getPhaseStatesService;
