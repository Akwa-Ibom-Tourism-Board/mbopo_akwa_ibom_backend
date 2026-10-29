import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import submitResultsService from "./submit-results.service";
import closePhaseService from "../../stages/services/close-phase.service";
import { AdminRole } from "../../users/AdminUser";
import type { PhaseId } from "../phases.config";

// Super Admin only (route-gated via "results.submitAnytime"): submit the
// results and close the stage in one step.
const submitResultsAndCloseService = errorUtilities.withServiceErrorHandling(
  async (actorId: string, actorRole: AdminRole, phase: PhaseId, passedIds: string[]) => {
    const submitted = await submitResultsService(actorId, actorRole, phase, passedIds);
    await closePhaseService(actorId, phase);

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Results submitted and stage closed",
      submitted?.data,
    );
  },
);

export default submitResultsAndCloseService;
