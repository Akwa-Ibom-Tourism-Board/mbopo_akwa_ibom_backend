import { User } from "../../auth/User";
import { Application } from "../../applicants/application/Application";
import { buildRegistrationProgress } from "./applicant-progress.helpers";

/**
 * The "Applicants" admin view's row shape — every registered account, not
 * just submitted ones. Deliberately lighter than
 * candidate.helpers.ts's serializeCandidateForViewer: this is Customer
 * Service's primary view (follow-up before the deadline), so it carries
 * contact info + where-they-stopped, not application content or any
 * judging-stage concept — Applicants has no judging state at all.
 */
export function serializeApplicant(user: User, application: Application | null) {
  const json: any = user.toJSON();

  return {
    id: json.id,
    firstName: json.firstName ?? null,
    lastName: json.lastName ?? null,
    email: json.email,
    phoneNumber: json.phoneNumber ?? null,
    emailVerified: json.emailVerified,
    identityVerified: json.identityVerified,
    active: json.active,
    createdAt: json.createdAt,
    applicationId: application ? application.get("id") : null,
    progress: buildRegistrationProgress(user, application),
  };
}
