import { AdminRole } from "./users/AdminUser";

/*
 * Server-side source of truth for the admin portal's permission matrix.
 * Ported from mbopo_akwa_ibom_admin_frontend's src/lib/rbac.ts, which
 * until now was a frontend-only check ("decides what the UI shows... does
 * nothing to stop a direct API call" — see that file's own warning
 * comment). This is the real enforcement; the two must be kept in sync by
 * hand (separate repos, no shared package) whenever either changes.
 *
 * Two capabilities below (`applicants.view`, `applicants.manage`) don't
 * exist in the frontend's matrix yet — they're new, for the Applicants-
 * vs-Contestants split (see admin-candidates.routes.ts) — add the same two
 * to the frontend's rbac.ts when Stage 7 wires it up for real.
 */

export type Capability =
  // Applicants — every registered account, from sign-up, regardless of
  // whether they ever finish. Customer Service can see but not manage.
  | "applicants.view"
  | "applicants.manage"
  // Contestants — only fully-submitted applications. Customer Service
  // deliberately has none of these.
  | "candidates.view"
  | "candidates.editPublicProfile"
  | "candidates.viewIdentity"
  | "candidates.viewDetails"
  | "stages.view"
  | "candidates.editDetails"
  | "candidates.viewActivity"
  // Judging — the two judge roles only. Deliberately granted to no other
  // role, including Super Admin: nobody outside the panel sees live scores.
  | "judging.access"
  | "judging.score"
  | "judging.decide"
  | "judging.leaderboard"
  | "results.submit"
  | "results.submitAnytime"
  | "stages.close"
  | "stages.open"
  | "stages.reopenAny"
  // Voting platform
  | "voting.pricing"
  | "voting.news"
  | "voting.sponsors"
  // Media's own upload path (Stage 4)
  | "media.upload"
  // Users
  | "users.manage"
  // Complaints
  | "complaints.view"
  | "complaints.respond"
  | "complaints.reassign"
  // Audit trail
  | "activity.view";

export const PERMISSIONS: Record<Capability, readonly AdminRole[]> = {
  "applicants.view": [
    AdminRole.SuperAdmin,
    AdminRole.Admin,
    AdminRole.CustomerService,
  ],
  "applicants.manage": [AdminRole.SuperAdmin, AdminRole.Admin],

  "candidates.view": [
    AdminRole.SuperAdmin,
    AdminRole.Admin,
    AdminRole.Media,
    AdminRole.Judge,
    AdminRole.HeadJudge,
  ],
  "candidates.editPublicProfile": [
    AdminRole.SuperAdmin,
    AdminRole.Admin,
    AdminRole.Media,
  ],
  "candidates.viewIdentity": [AdminRole.SuperAdmin, AdminRole.Admin],
  "candidates.viewDetails": [
    AdminRole.SuperAdmin,
    AdminRole.Admin,
    AdminRole.Judge,
    AdminRole.HeadJudge,
  ],
  "stages.view": [
    AdminRole.SuperAdmin,
    AdminRole.Admin,
    AdminRole.Judge,
    AdminRole.HeadJudge,
  ],
  "candidates.editDetails": [AdminRole.SuperAdmin, AdminRole.Admin],
  "candidates.viewActivity": [AdminRole.SuperAdmin, AdminRole.Admin],

  "judging.access": [AdminRole.Judge, AdminRole.HeadJudge],
  "judging.score": [AdminRole.Judge, AdminRole.HeadJudge],
  "judging.decide": [AdminRole.Judge, AdminRole.HeadJudge],
  "judging.leaderboard": [AdminRole.Judge, AdminRole.HeadJudge],
  "results.submit": [AdminRole.HeadJudge, AdminRole.SuperAdmin],
  "results.submitAnytime": [AdminRole.SuperAdmin],
  "stages.close": [AdminRole.HeadJudge, AdminRole.Admin, AdminRole.SuperAdmin],

  "stages.open": [AdminRole.SuperAdmin, AdminRole.Admin],
  "stages.reopenAny": [AdminRole.SuperAdmin],

  "voting.pricing": [AdminRole.SuperAdmin, AdminRole.Admin],
  "voting.news": [AdminRole.SuperAdmin, AdminRole.Admin, AdminRole.Media],
  "voting.sponsors": [AdminRole.SuperAdmin, AdminRole.Admin, AdminRole.Media],

  "media.upload": [AdminRole.SuperAdmin, AdminRole.Admin, AdminRole.Media],

  "users.manage": [AdminRole.SuperAdmin, AdminRole.Admin],

  "complaints.view": [
    AdminRole.SuperAdmin,
    AdminRole.Admin,
    AdminRole.CustomerService,
  ],
  "complaints.respond": [AdminRole.CustomerService],
  "complaints.reassign": [AdminRole.SuperAdmin, AdminRole.Admin],

  "activity.view": [AdminRole.SuperAdmin, AdminRole.Admin],
};

// Which roles a given role may create/edit/deactivate. SuperAdmin is never
// a value anywhere — it can't be created through any API, by anyone; see
// admin/helpers/admin-users.helpers.ts's assertAssignable().
export const ASSIGNABLE_ROLES: Record<AdminRole, readonly AdminRole[]> = {
  [AdminRole.SuperAdmin]: [
    AdminRole.Admin,
    AdminRole.Media,
    AdminRole.Judge,
    AdminRole.HeadJudge,
    AdminRole.CustomerService,
  ],
  [AdminRole.Admin]: [
    AdminRole.Media,
    AdminRole.Judge,
    AdminRole.HeadJudge,
    AdminRole.CustomerService,
  ],
  [AdminRole.Media]: [],
  [AdminRole.Judge]: [],
  [AdminRole.HeadJudge]: [],
  [AdminRole.CustomerService]: [],
};

export const isJudgeRole = (role: AdminRole | null | undefined) =>
  role === AdminRole.Judge || role === AdminRole.HeadJudge;

export function can(
  role: AdminRole | null | undefined,
  capability: Capability,
): boolean {
  return !!role && PERMISSIONS[capability].includes(role);
}

export function canAssignRole(
  actor: AdminRole | null | undefined,
  target: AdminRole,
): boolean {
  return !!actor && ASSIGNABLE_ROLES[actor].includes(target);
}
