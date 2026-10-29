import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { buildEnrichedStandings } from "../../helpers/leaderboard.helpers";
import { AdminRole } from "../../users/AdminUser";
import type { PhaseId } from "../phases.config";

// Judges-only data — gated at the route via "judging.leaderboard", granted
// to no role but Judge/Head Judge, including Super Admin: nobody outside
// the panel sees live scores.
const getLeaderboardService = errorUtilities.withServiceErrorHandling(
  async (viewerRole: AdminRole, phase: PhaseId) => {
    const entries = await buildEnrichedStandings(phase, viewerRole);
    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Leaderboard fetched", entries);
  },
);

export default getLeaderboardService;
