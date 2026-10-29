import type { Round } from "../judging/stages.config";

/**
 * Ported verbatim from mbopo_akwa_ibom_admin_frontend's
 * src/features/judging/utils/scoring.ts — keep the two in sync by hand.
 *
 * SCORING POLICY (a real decision, not a UI detail):
 *  - round score = AVERAGE of that round's criteria scores (so rounds with
 *    different criteria counts stay comparable on the same 1–10 scale)
 *  - a judge's stage score = AVERAGE of the round scores they've SUBMITTED
 *  - a candidate's aggregate = SUM (total) and AVERAGE across judges
 * Drafts never count toward any of these.
 */
export interface ScoreLike {
  roundId: string;
  values: Record<string, number>;
  status: "draft" | "submitted";
}

export function avg(nums: number[]): number | null {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
}

export function roundScore(values: Record<string, number>, criteria: string[]): number | null {
  return avg(criteria.map((c) => values[c]).filter((v): v is number => v != null));
}

export const isComplete = (values: Record<string, number>, criteria: string[]): boolean =>
  criteria.every((c) => values[c] != null);

export function stageScoreForJudge(
  scores: ScoreLike[],
  rounds: Round[],
): { score: number; rounds: number } | null {
  const perRound = rounds
    .map((r) => {
      const s = scores.find((x) => x.roundId === r.id && x.status === "submitted");
      return s ? roundScore(s.values, r.criteria) : null;
    })
    .filter((v): v is number => v != null);
  const score = avg(perRound);
  return score == null ? null : { score, rounds: perRound.length };
}
