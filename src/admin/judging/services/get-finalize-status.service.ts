import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { buildFinalizeStatus } from "../../helpers/leaderboard.helpers";
import type { PhaseId } from "../phases.config";

// How far each judge is through the stage's candidates — what stands
// between the Head Judge and finalizing. Judges-only (reveals scoring
// progress, not scores).
const getFinalizeStatusService = errorUtilities.withServiceErrorHandling(
  async (phase: PhaseId) => {
    const status = await buildFinalizeStatus(phase);
    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Finalize status fetched", status);
  },
);

export default getFinalizeStatusService;
