import { Op } from "sequelize";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { Application, CandidateJudgingStatus } from "../../../applicants/application/Application";
import { requireOpenPhase } from "../../helpers/phase-state.helpers";
import { applyJudgingDecision } from "../../helpers/candidate-judging.helpers";
import { recordActivity } from "../../helpers/activity.helpers";
import type { PhaseId } from "../phases.config";

// Rule-breakers only — a normal cut happens via submit-results, not here.
const disqualifyService = errorUtilities.withServiceErrorHandling(
  async (actorId: string, applicationIds: string[], reason: string) => {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      throw errorUtilities.createError(
        "A disqualification reason is required",
        StatusCodes.BAD_REQUEST,
      );
    }

    const targets = await Application.findAll({ where: { id: { [Op.in]: applicationIds } } });
    if (targets.length !== applicationIds.length) {
      throw errorUtilities.createError("Candidate not found", StatusCodes.NOT_FOUND);
    }

    const phases = new Set(targets.map((t) => t.get("phase") as PhaseId));
    for (const phase of phases) {
      await requireOpenPhase(phase);
    }
    for (const target of targets) {
      if (target.get("candidateStatus") !== CandidateJudgingStatus.Active) {
        throw errorUtilities.createError(
          `This candidate isn't competing, so can't be disqualified now`,
          StatusCodes.CONFLICT,
        );
      }
    }

    const result: Application[] = [];
    for (const phase of phases) {
      const batch = targets
        .filter((t) => (t.get("phase") as PhaseId) === phase)
        .map((t) => t.get("id") as string);
      result.push(
        ...(await applyJudgingDecision(batch, {
          candidateStatus: CandidateJudgingStatus.Disqualified,
          disqualificationReason: trimmedReason,
          disqualifiedAtPhase: phase,
        })),
      );
    }

    await recordActivity(
      actorId,
      "judging",
      `Disqualified ${result.length} candidate(s) — ${trimmedReason}`,
      result.map((r) => r.get("id") as string),
    );

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Candidate(s) disqualified",
      result,
    );
  },
);

export default disqualifyService;
