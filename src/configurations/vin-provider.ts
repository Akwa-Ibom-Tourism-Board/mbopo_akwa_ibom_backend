import { dvpPost } from "./dvp-client";

export interface VINVerificationResult {
  vin: string;
  lga?: string | undefined;
  ward?: string | undefined;
  state?: string | undefined;
  firstName?: string | undefined;
  lastName?: string | undefined;
}

interface DvpVinRecord {
  vin: string;
  first_name?: string | null;
  last_name?: string | null;
  unit?: {
    ward?: string | null;
    state?: string | null;
    registration_area?: { name?: string | null; lga?: { name?: string | null } } | null;
  } | null;
}

// INEC delimitation state code for Akwa Ibom. DVP returns the code ("03"),
// not the name, and auth.helpers' isAkwaIbomIndigene() compares by name.
const AKWA_IBOM_STATE_CODE = "03";

/**
 * Verifies a single VIN against the DVP (POST /identity/vin) and maps it to
 * the neutral shape auth.helpers' isAkwaIbomIndigene() consumes.
 */
const verifyVIN = async (vin: string): Promise<VINVerificationResult> => {
  const record = await dvpPost<DvpVinRecord>(
    "/identity/vin",
    { vin },
    "VIN not found. Please ensure your VIN is correct and try again.",
  );

  const unit = record.unit;
  const stateCode = unit?.state ?? undefined;

  return {
    vin: record.vin,
    lga: unit?.registration_area?.lga?.name ?? undefined,
    ward: unit?.registration_area?.name ?? unit?.ward ?? undefined,
    state: stateCode === AKWA_IBOM_STATE_CODE ? "Akwa Ibom" : stateCode,
    firstName: record.first_name ?? undefined,
    lastName: record.last_name ?? undefined,
  };
};

export default verifyVIN;
