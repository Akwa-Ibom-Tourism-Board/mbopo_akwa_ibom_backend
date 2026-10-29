import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { getOrCreatePhaseState, countedJudges } from "../../helpers/phase-state.helpers";
import { PhaseStatus } from "../PhaseState";
import { recordActivity } from "../../helpers/activity.helpers";
import { phaseTitle, type PhaseId } from "../../judging/phases.config";

/**
 * Closes a stage — gated at the route via "stages.close" (Head Judge,
 * Admin, Super Admin). Requires results to already be submitted (everyone
 * reaches that the same way: the Head Judge submits them directly, or a
 * Super Admin via submit-results-and-close, which submits first). Closing
 * changes no candidate — it just ends the stage so the next can open.
 */
const closePhaseService = errorUtilities.withServiceErrorHandling(
  async (actorId: string, phaseId: PhaseId) => {
    const state = await getOrCreatePhaseState(phaseId);
    if (state.get("status") !== PhaseStatus.Open) {
      throw errorUtilities.createError(
        `${phaseTitle(phaseId)} isn't open, so it can't be closed`,
        StatusCodes.CONFLICT,
      );
    }
    if (!state.get("resultsSubmittedAt")) {
      throw errorUtilities.createError("Submit the results first", StatusCodes.CONFLICT);
    }

    const judges = await countedJudges(phaseId);
    await state.update({
      status: PhaseStatus.Closed,
      closedAt: new Date(),
      closedBy: actorId,
      // Freeze whose scores counted — later deactivations must not touch
      // this stage once it's closed.
      countedJudgeIds: judges.map((j) => j.id),
    } as any);

    await recordActivity(actorId, "judging", `Closed ${phaseTitle(phaseId)}`);

    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Stage closed");
  },
);

export default closePhaseService;
