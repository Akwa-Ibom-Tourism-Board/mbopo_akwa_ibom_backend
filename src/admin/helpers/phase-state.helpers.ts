import { Op } from "sequelize";
import errorUtilities from "../../configurations/error-handler";
import { StatusCodes } from "../../configurations/statusCodes";
import { PhaseState, PhaseStatus } from "../stages/PhaseState";
import { AdminUser, AdminRole } from "../users/AdminUser";
import { phaseTitle, type PhaseId } from "../judging/phases.config";

export interface CountedJudge {
  id: string;
  name: string;
  head: boolean;
  active: boolean;
}

/** Row is created lazily (default "pending") — migrations stay schema-only. */
export async function getOrCreatePhaseState(phaseId: PhaseId): Promise<PhaseState> {
  const [state] = await PhaseState.findOrCreate({
    where: { phaseId },
    defaults: { phaseId, status: PhaseStatus.Pending } as any,
  });
  return state;
}

/**
 * WHOSE SCORES COUNT in a stage (ported from the frontend's countedJudges
 * in judging/api/index.ts):
 *  - a stage that isn't closed counts every judge/head-judge whose account
 *    is ACTIVE right now — deactivating one removes their scores from it,
 *    reactivating brings them back (scores are kept, just not counted);
 *  - a closed stage counts exactly the judges it was closed with, frozen in
 *    PhaseState.countedJudgeIds — deactivating someone afterwards changes
 *    nothing about it.
 */
export async function countedJudges(phaseId: PhaseId): Promise<CountedJudge[]> {
  const roster = await AdminUser.findAll({
    where: { role: [AdminRole.Judge, AdminRole.HeadJudge] },
  });
  const byId = new Map(roster.map((r) => [r.get("id") as string, r]));
  const state = await getOrCreatePhaseState(phaseId);

  if (state.get("status") === PhaseStatus.Closed) {
    const ids = (state.get("countedJudgeIds") as string[] | null) ?? [];
    return ids.map((id) => {
      const r = byId.get(id);
      return {
        id,
        name: r ? `${r.get("firstName")} ${r.get("lastName")}` : id,
        head: r ? (r.get("role") as AdminRole) === AdminRole.HeadJudge : false,
        active: r ? Boolean(r.get("active")) : false,
      };
    });
  }

  return roster
    .filter((r) => r.get("active"))
    .map((r) => ({
      id: r.get("id") as string,
      name: `${r.get("firstName")} ${r.get("lastName")}`,
      head: (r.get("role") as AdminRole) === AdminRole.HeadJudge,
      active: true,
    }));
}

export interface PhaseActor {
  id: string;
  name: string;
  role: AdminRole;
}

/**
 * Resolves every openedBy/closedBy/resultsSubmittedBy/reopenedBy UUID on a
 * batch of PhaseState rows into display-ready {id, name, role} — the admin
 * frontend wants to show who did what (and their role, to hide a Super
 * Admin's identity from an Admin), but the model itself deliberately keeps
 * only the raw FK (see PhaseState.ts's own note on this). One batch lookup
 * for the whole set, not per-row.
 */
export async function serializePhaseStates(states: PhaseState[]) {
  const actorIds = [
    ...new Set(
      states.flatMap((s) => [
        s.get("openedBy"),
        s.get("closedBy"),
        s.get("resultsSubmittedBy"),
        s.get("reopenedBy"),
      ]),
    ),
  ].filter((id): id is string => Boolean(id));

  const actors = actorIds.length
    ? await AdminUser.findAll({ where: { id: { [Op.in]: actorIds } } })
    : [];
  const byId = new Map(actors.map((a) => [a.get("id") as string, a]));

  const resolve = (id: unknown): PhaseActor | null => {
    if (typeof id !== "string") return null;
    const actor = byId.get(id);
    if (!actor) return null;
    return {
      id,
      name: `${actor.get("firstName")} ${actor.get("lastName")}`,
      role: actor.get("role") as AdminRole,
    };
  };

  return states.map((s) => {
    const json: any = s.toJSON();
    return {
      ...json,
      openedBy: resolve(json.openedBy),
      closedBy: resolve(json.closedBy),
      resultsSubmittedBy: resolve(json.resultsSubmittedBy),
      reopenedBy: resolve(json.reopenedBy),
    };
  });
}

/** Throws unless the phase is open and its results haven't been submitted. */
export async function requireOpenPhase(phaseId: PhaseId): Promise<PhaseState> {
  const state = await getOrCreatePhaseState(phaseId);
  const status = state.get("status");
  if (status === PhaseStatus.Closed) {
    throw errorUtilities.createError(
      `${phaseTitle(phaseId)} is closed — its scores are locked.`,
      StatusCodes.CONFLICT,
    );
  }
  if (status === PhaseStatus.Pending) {
    throw errorUtilities.createError(
      `${phaseTitle(phaseId)} hasn't been opened yet.`,
      StatusCodes.CONFLICT,
    );
  }
  if (state.get("resultsSubmittedAt")) {
    throw errorUtilities.createError(
      `Results for ${phaseTitle(phaseId)} have been submitted — its scores are locked.`,
      StatusCodes.CONFLICT,
    );
  }
  return state;
}
