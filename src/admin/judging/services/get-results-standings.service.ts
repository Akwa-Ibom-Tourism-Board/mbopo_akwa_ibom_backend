import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { buildEnrichedStandings } from "../../helpers/leaderboard.helpers";
import { AdminRole } from "../../users/AdminUser";
import type { PhaseId } from "../phases.config";

// The ranked standings the Head Judge — or the Super Admin, who may also
// submit results — chooses from. Gated at the route via "results.submit".
// This is the only place the Super Admin sees scores at all (ranks/totals,
// inside the submit-results flow); they can't enter or change any.
const getResultsStandingsService = errorUtilities.withServiceErrorHandling(
  async (viewerRole: AdminRole, phase: PhaseId) => {
    const entries = await buildEnrichedStandings(phase, viewerRole);
    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Standings fetched", entries);
  },
);

export default getResultsStandingsService;
