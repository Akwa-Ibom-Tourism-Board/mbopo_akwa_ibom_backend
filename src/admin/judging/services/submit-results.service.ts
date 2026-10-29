import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { Application, CandidateJudgingStatus } from "../../../applicants/application/Application";
import { User } from "../../../auth/User";
import { queueEmail } from "../../../configurations/email-queue";
import { candidateAdvancedTemplate } from "../../../applicants/application/emailTemplates/candidateAdvanced";
import { candidateWinnerTemplate } from "../../../applicants/application/emailTemplates/candidateWinner";
import { requireOpenPhase } from "../../helpers/phase-state.helpers";
import { getJudgingPool, applyJudgingDecision } from "../../helpers/candidate-judging.helpers";
import { buildFinalizeStatus } from "../../helpers/leaderboard.helpers";
import { PhaseState } from "../../stages/PhaseState";
import { can, type Capability } from "../../rbac";
import { AdminRole } from "../../users/AdminUser";
import { PHASE_QUOTA } from "../stages.config";
import { getPhaseDef, nextPhaseId, type PhaseId } from "../phases.config";

export interface SubmitResultsResult {
  through: number;
  eliminated: number;
}

// Short phrase for the advancement email's "you have advanced to ___" line.
// "senatorial" and "gf-r1" get the stage-level phrasing (that's the
// meaningful news — a new stage opened for them); the other Grand Finale
// rounds get their own round label.
const describeDestination = (phase: PhaseId): string => {
  if (phase === "senatorial") return "Senatorial District Selection";
  if (phase === "gf-r1") return "the Grand Finale";
  return `Grand Finale ${getPhaseDef(phase).label}`;
};

// Best-effort, like every other email call site in this codebase (see
// application/services/submit.service.ts) — never allowed to fail the
// results submission that triggered it. Fires only for "advanced"/"winner";
// elimination and disqualification queue nothing at all, by design.
const notifyAdvancement = async (
  applications: Application[],
  finalRound: boolean,
  nextPhase: PhaseId | undefined,
) => {
  await Promise.all(
    applications.map(async (application) => {
      try {
        const user = await User.findByPk(application.get("applicantId") as string, {
          attributes: ["email", "firstName"],
        });
        if (!user) return;

        const firstName = (user.get("firstName") as string | null) ?? null;
        const template =
          finalRound || !nextPhase
            ? candidateWinnerTemplate(firstName)
            : candidateAdvancedTemplate(firstName, describeDestination(nextPhase));

        await queueEmail({
          to: user.get("email") as string,
          subject: template.subject,
          htmlBody: template.htmlBody,
        });
      } catch (error: any) {
        console.error("Failed to queue advancement email:", error.message);
      }
    }),
  );
};

/**
 * Choose who goes through. The Head Judge can do it once every judge has
 * finished scoring (results.submit); the Super Admin can do it at any time
 * (results.submitAnytime), no prerequisites. Everyone else still competing
 * is eliminated; the Grand Finale's last round leaves one winner.
 * Submitting locks every judge's scores for this phase but leaves the
 * stage open until it is closed — see close-phase.service.ts.
 */
const submitResultsService = errorUtilities.withServiceErrorHandling(
  async (
    actorId: string,
    actorRole: AdminRole,
    phase: PhaseId,
    passedIds: string[],
  ): Promise<ReturnType<typeof responseUtilities.handleServicesResponse>> => {
    await requireOpenPhase(phase);

    const pool = await getJudgingPool();
    const field = pool.filter(
      (application) =>
        application.get("phase") === phase &&
        application.get("candidateStatus") === CandidateJudgingStatus.Active,
    );

    const hasCapability = (capability: Capability) => can(actorRole, capability);
    if (!hasCapability("results.submitAnytime")) {
      const status = await buildFinalizeStatus(phase);
      if (!status.ready) {
        const waiting = status.judges.filter((j) => j.outstanding > 0).map((j) => j.name);
        throw errorUtilities.createError(
          `Every judge must finish scoring first. Waiting on: ${waiting.join(", ")}.`,
          StatusCodes.CONFLICT,
        );
      }
    }

    const passed = new Set(passedIds);
    if (passed.size === 0) {
      throw errorUtilities.createError("Choose who goes through", StatusCodes.BAD_REQUEST);
    }
    const fieldIds = new Set(field.map((c) => c.get("id") as string));
    if (![...passed].every((id) => fieldIds.has(id))) {
      throw errorUtilities.createError(
        "Only candidates competing in this stage can go through",
        StatusCodes.BAD_REQUEST,
      );
    }

    const quota = PHASE_QUOTA[phase];
    if (quota) {
      const lgas = new Set(field.map((c) => c.get("localGovernment") as string));
      for (const lga of lgas) {
        const n = field.filter(
          (c) => passed.has(c.get("id") as string) && c.get("localGovernment") === lga,
        ).length;
        if (n > quota) {
          throw errorUtilities.createError(
            `${lga} can send at most ${quota} through (${n} chosen)`,
            StatusCodes.BAD_REQUEST,
          );
        }
      }
    }

    const finalRound = phase === "gf-r5";
    if (finalRound && passed.size !== 1) {
      throw errorUtilities.createError(
        "The last round must leave exactly one winner",
        StatusCodes.BAD_REQUEST,
      );
    }
    if (phase.startsWith("gf-") && !finalRound && passed.size >= field.length) {
      throw errorUtilities.createError(
        "A round has to eliminate at least one candidate",
        StatusCodes.BAD_REQUEST,
      );
    }

    const out = field.filter((c) => !passed.has(c.get("id") as string));
    if (out.length) {
      await applyJudgingDecision(
        out.map((c) => c.get("id") as string),
        { candidateStatus: CandidateJudgingStatus.Eliminated, eliminatedAtPhase: phase },
      );
    }
    const advanced = await applyJudgingDecision([...passed], {
      candidateStatus: finalRound ? CandidateJudgingStatus.Winner : CandidateJudgingStatus.Advanced,
    });
    await notifyAdvancement(advanced, finalRound, nextPhaseId(phase));

    const [state] = await PhaseState.findOrCreate({ where: { phaseId: phase }, defaults: { phaseId: phase } as any });
    await state.update({
      resultsSubmittedAt: new Date(),
      resultsSubmittedBy: actorId,
      passedIds: [...passed],
    } as any);

    const result: SubmitResultsResult = { through: passed.size, eliminated: out.length };
    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Results submitted", result);
  },
);

export default submitResultsService;
