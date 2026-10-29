import { ActivityLog, type ActivityCategory } from "../activity/ActivityLog";
import { AdminUser, AdminRole } from "../users/AdminUser";

/**
 * Appends to the global Activity Log, and — when applicationIds is given —
 * to those candidates' own Activity tab too (same row serves both views;
 * see services/list.service.ts and services/list-for-candidate.service.ts).
 * Never allowed to break the action that triggered it.
 */
export async function recordActivity(
  actorId: string | null,
  category: ActivityCategory,
  summary: string,
  applicationIds?: string[],
): Promise<void> {
  try {
    const ids = applicationIds?.length ? applicationIds : [null];
    await ActivityLog.bulkCreate(
      ids.map((applicationId) => ({ actorId, applicationId, category, summary }) as any),
    );
  } catch (error: any) {
    console.error("Failed to record activity:", error.message);
  }
}

/**
 * Resolved fresh per request (never denormalized) — whether the viewer may
 * see a given entry at all: only a Super Admin ever sees another Super
 * Admin's own actions; for an Admin those entries simply aren't there.
 */
export async function visibleToViewer(viewerRole: AdminRole, actorId: string | null): Promise<boolean> {
  if (viewerRole === AdminRole.SuperAdmin || !actorId) return true;
  const actor = await AdminUser.findByPk(actorId, { attributes: ["role"] });
  return actor?.get("role") !== AdminRole.SuperAdmin;
}
