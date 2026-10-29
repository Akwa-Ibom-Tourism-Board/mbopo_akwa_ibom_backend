import { Op } from "sequelize";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { CandidateJudgingStatus } from "../../../applicants/application/Application";
import { PhaseState, PhaseStatus } from "../PhaseState";
import { JudgeScore } from "../../judging/JudgeScore";
import { getOrCreatePhaseState } from "../../helpers/phase-state.helpers";
import { getJudgingPool, applyJudgingDecision } from "../../helpers/candidate-judging.helpers";
import { roundsOf } from "../../judging/stages.config";
import { can } from "../../rbac";
import { AdminRole } from "../../users/AdminUser";
import { PHASES, phaseIndex, stageOfPhase, type PhaseId } from "../../judging/phases.config";

/**
 * Reopens a closed stage so scores can be corrected and it can be
 * finalized again — gated at the route via "stages.open" (Admin/Super
 * Admin), with one extra rule enforced here: an Admin may only reopen the
 * MOST RECENTLY CLOSED stage (once a later one is also closed, it can't);
 * a Super Admin ("stages.reopenAny") may reopen any closed stage.
 *
 * Reopening undoes that stage's finalization (candidates who went through
 * or were cut return to it; disqualifications made inside it stand) and
 * WIPES every stage after it — scores, movements, disqualifications — back
 * to "never opened". The reopened stage keeps its own scores.
 */
const reopenPhaseService = errorUtilities.withServiceErrorHandling(
  async (actorId: string, actorRole: AdminRole, phaseId: PhaseId) => {
    const state = await getOrCreatePhaseState(phaseId);
    if (state.get("status") !== PhaseStatus.Closed) {
      throw errorUtilities.createError(
        "Only a closed stage can be reopened",
        StatusCodes.CONFLICT,
      );
    }

    const idx = phaseIndex(phaseId);
    const allStates = await PhaseState.findAll();
    const statusByPhase = new Map(allStates.map((s) => [s.get("phaseId") as PhaseId, s.get("status")]));
    const laterClosed = PHASES.some(
      (p) => phaseIndex(p.id) > idx && statusByPhase.get(p.id) === PhaseStatus.Closed,
    );
    if (laterClosed && !can(actorRole, "stages.reopenAny")) {
      throw errorUtilities.createError(
        "This stage can't be reopened — the event has moved on",
        StatusCodes.FORBIDDEN,
      );
    }

    // Later stages that were actually opened lose everything; ones still
    // pending have nothing to lose.
    const later = PHASES.filter((p) => phaseIndex(p.id) > idx).map((p) => p.id);
    const wiped = later.filter((id) => (statusByPhase.get(id) ?? PhaseStatus.Pending) !== PhaseStatus.Pending);
    const wipedRoundIds = wiped.flatMap((id) => roundsOf(id).map((r) => r.id));
    if (wipedRoundIds.length) {
      await JudgeScore.destroy({ where: { roundId: { [Op.in]: wipedRoundIds } } });
    }

    // Everyone who had reached this stage or beyond returns to it, still
    // competing — except people disqualified inside this very stage.
    const pool = await getJudgingPool();
    const affected = pool.filter((application) => {
      const phase = application.get("phase") as PhaseId | null;
      if (!phase || phaseIndex(phase) < idx) return false;
      const disqualifiedHere =
        application.get("candidateStatus") === CandidateJudgingStatus.Disqualified &&
        application.get("disqualifiedAtPhase") === phaseId;
      return !disqualifiedHere;
    });
    await applyJudgingDecision(
      affected.map((c) => c.get("id") as string),
      {
        phase: phaseId,
        stage: stageOfPhase(phaseId),
        candidateStatus: CandidateJudgingStatus.Active,
        eliminatedAtPhase: null,
        disqualifiedAtPhase: null,
        disqualificationReason: null,
      },
    );

    for (const id of later) {
      const laterState = await getOrCreatePhaseState(id);
      await laterState.update({
        status: PhaseStatus.Pending,
        openedAt: null,
        openedBy: null,
        closedAt: null,
        closedBy: null,
        countedJudgeIds: null,
        resultsSubmittedAt: null,
        resultsSubmittedBy: null,
        reopenedAt: null,
        reopenedBy: null,
        passedIds: null,
      } as any);
    }

    await state.update({
      status: PhaseStatus.Open,
      closedAt: null,
      closedBy: null,
      countedJudgeIds: null,
      resultsSubmittedAt: null,
      resultsSubmittedBy: null,
      passedIds: null,
      reopenedAt: new Date(),
      reopenedBy: actorId,
    } as any);

    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Stage reopened", { wiped });
  },
);

export default reopenPhaseService;
