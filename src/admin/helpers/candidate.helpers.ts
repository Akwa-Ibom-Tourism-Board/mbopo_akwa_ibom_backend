import { User } from "../../auth/User";
import { Application } from "../../applicants/application/Application";
import { senatorialDistrictOf } from "../../configurations/constants";
import { can, type Capability } from "../rbac";
import { AdminRole } from "../users/AdminUser";

/**
 * The one place that decides how much of a contestant's record a given
 * viewer gets back — enforced here, not just hidden in the frontend. Three
 * tiers, gated by the existing candidates.* capabilities (see rbac.ts):
 *  - candidates.view only (Media): name/photo/location/stage — nothing
 *    about the application itself.
 *  - + candidates.viewDetails (Judge/Head Judge/Admin/Super Admin): the
 *    full application — contact info, background, media, story.
 *  - + candidates.viewIdentity (Admin/Super Admin only): raw NIN/VIN and
 *    the submit-time VIN verification outcome.
 */
export function serializeCandidateForViewer(
  user: User,
  application: Application,
  viewerRole: AdminRole | null | undefined,
) {
  const json: any = application.toJSON();
  const userJson: any = user.toJSON();
  const name = [userJson.firstName, userJson.lastName].filter(Boolean).join(" ");

  const base = {
    id: json.id,
    applicantId: json.applicantId,
    name,
    photo: userJson.avatarUrl ?? null,
    lga: json.localGovernment ?? null,
    senatorialDistrict: senatorialDistrictOf(json.localGovernment),
    status: json.status,
    referenceCode: json.referenceCode ?? null,
    submittedAt: json.submittedAt ?? null,
    voteCount: json.voteCount ?? 0,
    // Public-profile content lives in the base tier (not gated behind
    // candidates.viewDetails) because Media — who only ever holds
    // candidates.view — is exactly the role that manages it. It's also
    // what the public voting site eventually shows, so there's nothing
    // sensitive in it the way the rest of the application is.
    bio: json.bio ?? null,
    additionalPhotos: json.additionalPhotos ?? [],
    additionalVideos: json.additionalVideos ?? [],
  };

  const hasCapability = (capability: Capability) => can(viewerRole, capability);
  if (!hasCapability("candidates.viewDetails")) {
    return base;
  }

  const details = {
    ...base,
    // Judging state — gated behind viewDetails (not the base tier) so
    // Media never sees it, matching the admin frontend's own original
    // dummy design (Media gets name/bio/photos/videos and nothing about
    // where a candidate stands in the competition). Judge/Head Judge/
    // Admin/Super Admin all hold viewDetails, so the judging UI (which
    // filters candidates by exactly these fields — see inField()/
    // participantsOf() on both sides) always has them.
    stage: json.stage ?? null,
    phase: json.phase ?? null,
    candidateStatus: json.candidateStatus ?? null,
    disqualificationReason: json.disqualificationReason ?? null,
    eliminatedAtPhase: json.eliminatedAtPhase ?? null,
    disqualifiedAtPhase: json.disqualifiedAtPhase ?? null,
    middleName: userJson.middleName ?? null,
    gender: userJson.gender ?? null,
    dateOfBirth: userJson.dateOfBirth ?? null,
    phone: json.phone ?? null,
    socialMedia: json.socialMedia ?? null,
    nextOfKin: json.nextOfKin ?? null,
    nextOfKinPhone: json.nextOfKinPhone ?? null,
    nextOfKinRelationship: json.nextOfKinRelationship ?? null,
    village: json.village ?? null,
    residenceState: json.residenceState ?? null,
    city: json.city ?? null,
    address: json.address ?? null,
    education: json.education ?? null,
    educationOther: json.educationOther ?? null,
    institution: json.institution ?? null,
    institutionOther: json.institutionOther ?? null,
    occupation: json.occupation ?? null,
    occupationOther: json.occupationOther ?? null,
    talents: json.talents ?? null,
    languages: json.languages ?? null,
    initiative: json.initiative ?? null,
    why: json.why ?? null,
    certificateOfOriginUrl: json.certificateOfOriginUrl ?? null,
    fullImageUrl: json.fullImageUrl ?? null,
    fullImageUrl2: json.fullImageUrl2 ?? null,
    videoPitchUrl: json.videoPitchUrl ?? null,
  };

  if (!hasCapability("candidates.viewIdentity")) {
    return details;
  }

  return {
    ...details,
    nin: userJson.nin ?? null,
    vin: userJson.vin ?? null,
    draftVin: json.vin ?? null,
    isVinVerified: userJson.isVinVerified ?? null,
    vinVerificationFailedReason: userJson.vinVerificationFailedReason ?? null,
  };
}
