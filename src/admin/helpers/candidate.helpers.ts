import { User } from "../../auth/User";
import { Application } from "../../applicants/application/Application";
import { can, type Capability } from "../rbac";
import { AdminRole } from "../users/AdminUser";

// Cross-checked against Wikipedia's Akwa Ibom senatorial district pages and
// a 2015 INEC-linked LGA directory — same source/reasoning already used for
// mbopo_akwa_ibom_admin_frontend's BUILD_ME.md §8. Names must match
// configurations/constants.ts's AKWA_IBOM_LGAS exactly, character for
// character, or a candidate silently falls through senatorialDistrict as
// undefined.
const SENATORIAL_DISTRICTS: Record<string, readonly string[]> = {
  "Akwa Ibom North-East": [
    "Etinan",
    "Ibesikpo Asutan",
    "Ibiono Ibom",
    "Itu",
    "Nsit Atai",
    "Nsit Ibom",
    "Nsit Ubium",
    "Uruan",
    "Uyo",
  ],
  "Akwa Ibom North-West": [
    "Abak",
    "Essien Udim",
    "Etim Ekpo",
    "Ika",
    "Ikono",
    "Ikot Ekpene",
    "Ini",
    "Obot Akara",
    "Oruk Anam",
    "Ukanafun",
  ],
  "Akwa Ibom South": [
    "Eastern Obolo",
    "Eket",
    "Esit Eket",
    "Ibeno",
    "Ikot Abasi",
    "Mbo",
    "Mkpat Enin",
    "Okobo",
    "Onna",
    "Oron",
    "Udung Uko",
    "Urue-Offong/Oruko",
  ],
};

export function senatorialDistrictOf(lga: string | null | undefined): string | undefined {
  if (!lga) return undefined;
  for (const [district, lgas] of Object.entries(SENATORIAL_DISTRICTS)) {
    if (lgas.includes(lga)) return district;
  }
  return undefined;
}

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
  };

  const hasCapability = (capability: Capability) => can(viewerRole, capability);
  if (!hasCapability("candidates.viewDetails")) {
    return base;
  }

  const details = {
    ...base,
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
    bio: json.bio ?? null,
    additionalPhotos: json.additionalPhotos ?? [],
    additionalVideos: json.additionalVideos ?? [],
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
