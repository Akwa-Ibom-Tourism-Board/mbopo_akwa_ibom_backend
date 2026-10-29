import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { CandidateJudgingStatus } from "../../../applicants/application/Application";
import { getOrCreatePhaseState } from "../../helpers/phase-state.helpers";
import { getJudgingPool, applyJudgingDecision } from "../../helpers/candidate-judging.helpers";
import { PhaseStatus } from "../PhaseState";
import { recordActivity } from "../../helpers/activity.helpers";
import { prevPhaseId, phaseTitle, stageOfPhase, type PhaseId } from "../../judging/phases.config";

/**
 * Opens a stage. Candidates the Head Judge finalized through the previous
 * stage move into this one — gated at the route via "stages.open"
 * (Admin/Super Admin).
 */
const openPhaseService = errorUtilities.withServiceErrorHandling(
  async (actorId: string, phaseId: PhaseId) => {
    const state = await getOrCreatePhaseState(phaseId);
    if (state.get("status") !== PhaseStatus.Pending) {
      throw errorUtilities.createError(
        "That stage has already been opened",
        StatusCodes.CONFLICT,
      );
    }

    const prev = prevPhaseId(phaseId);
    if (prev) {
      const prevState = await getOrCreatePhaseState(prev);
      if (prevState.get("status") !== PhaseStatus.Closed) {
        throw errorUtilities.createError(
          `${phaseTitle(prev)} has to be closed first`,
          StatusCodes.CONFLICT,
        );
      }
    }

    let moved = 0;
    if (prev) {
      const pool = await getJudgingPool();
      const incoming = pool.filter(
        (application) =>
          application.get("phase") === prev &&
          application.get("candidateStatus") === CandidateJudgingStatus.Advanced,
      );
      moved = incoming.length;
      await applyJudgingDecision(
        incoming.map((c) => c.get("id") as string),
        { phase: phaseId, stage: stageOfPhase(phaseId), candidateStatus: CandidateJudgingStatus.Active },
      );
    }

    await state.update({ status: PhaseStatus.Open, openedAt: new Date(), openedBy: actorId } as any);

    await recordActivity(
      actorId,
      "judging",
      `Opened ${phaseTitle(phaseId)}${prev ? ` with ${moved} candidate(s)` : ""}`,
    );

    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Stage opened", { moved });
  },
);

export default openPhaseService;
