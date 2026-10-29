import { Op } from "sequelize";
import {
  Application,
  ApplicationStatus,
  CandidateStage,
  CandidateJudgingStatus,
} from "../../applicants/application/Application";
import { phaseIndex, type PhaseId } from "../judging/phases.config";

export type JudgingOutcome =
  | "incoming"
  | "competing"
  | "advanced"
  | "eliminated"
  | "disqualified"
  | "winner";

export interface JudgingParticipant {
  application: Application;
  outcome: JudgingOutcome;
}

/** Every submitted application — the judging system's full candidate pool. */
export async function getJudgingPool(): Promise<Application[]> {
  return Application.findAll({ where: { status: ApplicationStatus.Submitted } });
}

/** Candidates judges score in a stage: in it, and still competing. */
export const inField = (application: Application, phaseId: PhaseId): boolean =>
  application.get("phase") === phaseId &&
  application.get("candidateStatus") === CandidateJudgingStatus.Active;

/**
 * Who appears on a stage's page, and how that stage went for them. Ported
 * from the frontend's participantsOf (stages/utils/participants.ts):
 *  - a phase before theirs       -> they passed it ("advanced")
 *  - their own phase             -> their current standing there
 *  - the next phase, finalized   -> "incoming": through the previous stage
 *    and waiting for this one to open
 */
export function participantsOf(phaseId: PhaseId, applications: Application[]): JudgingParticipant[] {
  const idx = phaseIndex(phaseId);
  const out: JudgingParticipant[] = [];
  for (const application of applications) {
    const phase = application.get("phase") as PhaseId | null;
    if (!phase) continue;
    const ci = phaseIndex(phase);
    const status = application.get("candidateStatus") as CandidateJudgingStatus;

    if (ci > idx) {
      out.push({ application, outcome: "advanced" });
    } else if (ci === idx) {
      out.push({
        application,
        outcome: status === CandidateJudgingStatus.Active ? "competing" : (status as JudgingOutcome),
      });
    } else if (ci === idx - 1 && status === CandidateJudgingStatus.Advanced) {
      out.push({ application, outcome: "incoming" });
    }
  }
  return out;
}

export interface JudgingDecisionPatch {
  phase?: PhaseId;
  stage?: CandidateStage;
  candidateStatus?: CandidateJudgingStatus;
  disqualificationReason?: string | null;
  eliminatedAtPhase?: string | null;
  disqualifiedAtPhase?: string | null;
}

/**
 * THE one place that mutates a candidate's judging state — mirrors the
 * frontend's applyJudgingDecision (candidates/api/index.ts) being the
 * single point every judging action funnels through.
 */
export async function applyJudgingDecision(
  applicationIds: string[],
  patch: JudgingDecisionPatch,
): Promise<Application[]> {
  if (applicationIds.length === 0) return [];
  await Application.update(patch as any, { where: { id: { [Op.in]: applicationIds } } });
  return Application.findAll({ where: { id: { [Op.in]: applicationIds } } });
}
