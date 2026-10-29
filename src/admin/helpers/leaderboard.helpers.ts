import { Op } from "sequelize";
import { User } from "../../auth/User";
import { Application } from "../../applicants/application/Application";
import { JudgeScore, JudgeScoreStatus } from "../judging/JudgeScore";
import { getOrCreatePhaseState, countedJudges } from "./phase-state.helpers";
import { getJudgingPool, participantsOf } from "./candidate-judging.helpers";
import { serializeCandidateForViewer } from "./candidate.helpers";
import { roundsOf } from "../judging/stages.config";
import { avg, roundScore, stageScoreForJudge } from "./judging-scoring.helpers";
import { PhaseStatus } from "../stages/PhaseState";
import { AdminRole } from "../users/AdminUser";
import type { PhaseId } from "../judging/phases.config";

export interface LeaderboardEntry {
  applicationId: string;
  perJudge: Record<string, { score: number; rounds: number } | null>;
  total: number | null;
  average: number | null;
  perRound: Record<string, Record<string, number | null>>;
}

/**
 * Shared by the judges-only leaderboard and the Head Judge/Super Admin's
 * results-standings view — same numbers, different capability gate at the
 * route level (judging.leaderboard vs. results.submit). Ported from the
 * frontend's buildStandings in judging/api/index.ts.
 */
export async function buildStandings(phaseId: PhaseId): Promise<LeaderboardEntry[]> {
  const state = await getOrCreatePhaseState(phaseId);
  if (state.get("status") === PhaseStatus.Pending) return [];

  const rounds = roundsOf(phaseId);
  const judges = await countedJudges(phaseId);
  const pool = await getJudgingPool();
  const participants = participantsOf(phaseId, pool).filter((p) => p.outcome !== "incoming");

  const applicationIds = participants.map((p) => p.application.get("id") as string);
  const allScores =
    applicationIds.length === 0
      ? []
      : await JudgeScore.findAll({ where: { applicationId: { [Op.in]: applicationIds } } });

  return participants.map(({ application }) => {
    const applicationId = application.get("id") as string;
    const perJudge: LeaderboardEntry["perJudge"] = {};
    const perRound: LeaderboardEntry["perRound"] = {};
    for (const round of rounds) perRound[round.id] = {};

    for (const judge of judges) {
      const mine = allScores
        .filter((s) => s.get("judgeId") === judge.id && s.get("applicationId") === applicationId)
        .map((s) => ({
          roundId: s.get("roundId") as string,
          values: s.get("values") as Record<string, number>,
          status: s.get("status") as JudgeScoreStatus,
        }));
      perJudge[judge.id] = stageScoreForJudge(mine, rounds);
      for (const round of rounds) {
        const submitted = mine.find(
          (s) => s.roundId === round.id && s.status === JudgeScoreStatus.Submitted,
        );
        perRound[round.id]![judge.id] = submitted ? roundScore(submitted.values, round.criteria) : null;
      }
    }

    const judgeScores = Object.values(perJudge)
      .filter((v): v is { score: number; rounds: number } => v != null)
      .map((v) => v.score);

    return {
      applicationId,
      perJudge,
      perRound,
      total: judgeScores.length ? judgeScores.reduce((a, b) => a + b, 0) : null,
      average: avg(judgeScores),
    };
  });
}

/**
 * buildStandings() plus each entry's candidate display info (redacted per
 * viewer role, same as the Contestants endpoints) — shared by the
 * judges-only leaderboard and the Head Judge/Super Admin results-standings
 * view, which differ only in which capability gates the route.
 */
export async function buildEnrichedStandings(phaseId: PhaseId, viewerRole: AdminRole) {
  const standings = await buildStandings(phaseId);

  const applications = await Application.findAll({
    where: { id: { [Op.in]: standings.map((s) => s.applicationId) } },
  });
  const applicationById = new Map(applications.map((a) => [a.get("id") as string, a]));
  const applicantIds = applications.map((a) => a.get("applicantId") as string);
  const users = await User.findAll({ where: { id: { [Op.in]: applicantIds } } });
  const userByApplicantId = new Map(users.map((u) => [u.get("id") as string, u]));

  return standings
    .map((entry) => {
      const application = applicationById.get(entry.applicationId);
      const user = application && userByApplicantId.get(application.get("applicantId") as string);
      if (!application || !user) return null;
      return {
        candidate: serializeCandidateForViewer(user, application, viewerRole),
        perJudge: entry.perJudge,
        perRound: entry.perRound,
        total: entry.total,
        average: entry.average,
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null)
    .sort((a, b) => (b.total ?? -Infinity) - (a.total ?? -Infinity));
}

export interface FinalizeStatus {
  phaseId: PhaseId;
  stageStatus: PhaseStatus;
  fieldCount: number;
  judges: { id: string; name: string; head: boolean; outstanding: number }[];
  ready: boolean;
}

export async function buildFinalizeStatus(phaseId: PhaseId): Promise<FinalizeStatus> {
  const pool = await getJudgingPool();
  const field = pool.filter(
    (application) =>
      application.get("phase") === phaseId && application.get("candidateStatus") === "active",
  );
  const rounds = roundsOf(phaseId);
  const judgeList = await countedJudges(phaseId);

  const applicationIds = field.map((a) => a.get("id") as string);
  const scores =
    applicationIds.length === 0
      ? []
      : await JudgeScore.findAll({
          where: { applicationId: { [Op.in]: applicationIds }, status: JudgeScoreStatus.Submitted },
        });

  const judges = judgeList.map((judge) => ({
    id: judge.id,
    name: judge.name,
    head: judge.head,
    outstanding: field.filter((application) =>
      rounds.some(
        (round) =>
          !scores.some(
            (s) =>
              s.get("judgeId") === judge.id &&
              s.get("applicationId") === application.get("id") &&
              s.get("roundId") === round.id,
          ),
      ),
    ).length,
  }));

  const state = await getOrCreatePhaseState(phaseId);
  const stageStatus = state.get("status") as PhaseStatus;

  return {
    phaseId,
    stageStatus,
    fieldCount: field.length,
    judges,
    ready:
      stageStatus === PhaseStatus.Open &&
      field.length > 0 &&
      judges.length > 0 &&
      judges.every((j) => j.outstanding === 0),
  };
}
