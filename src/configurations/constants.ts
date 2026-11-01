// The 31 local government areas of Akwa Ibom State. Single source of truth —
// matches the frontend's shared/content/localGovernments.ts exactly.
export const AKWA_IBOM_LGAS = [
  "Abak",
  "Eastern Obolo",
  "Eket",
  "Esit Eket",
  "Essien Udim",
  "Etim Ekpo",
  "Etinan",
  "Ibeno",
  "Ibesikpo Asutan",
  "Ibiono Ibom",
  "Ika",
  "Ikono",
  "Ikot Abasi",
  "Ikot Ekpene",
  "Ini",
  "Itu",
  "Mbo",
  "Mkpat Enin",
  "Nsit Atai",
  "Nsit Ibom",
  "Nsit Ubium",
  "Obot Akara",
  "Okobo",
  "Onna",
  "Oron",
  "Oruk Anam",
  "Udung Uko",
  "Ukanafun",
  "Uruan",
  "Urue-Offong/Oruko",
  "Uyo",
] as const;

// Cross-checked against Wikipedia's Akwa Ibom senatorial district pages and
// a 2015 INEC-linked LGA directory. Names must match AKWA_IBOM_LGAS above
// exactly, character for character, or a candidate silently falls through
// senatorialDistrictOf() as undefined. Shared by the admin (candidates) and
// public (voting) features — lives here, not in either feature's own
// helpers, so neither depends on the other for it.
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

export const NIGERIAN_PHONE_REGEX = /^(0[789][01]\d{8}|234[789][01]\d{8})$/;

export const MINIMUM_ELIGIBLE_AGE = 22;
export const MAXIMUM_ELIGIBLE_AGE = 27;
