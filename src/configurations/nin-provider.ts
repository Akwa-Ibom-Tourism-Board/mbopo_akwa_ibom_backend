import { dvpPost } from "./dvp-client";

/**
 * Provider-neutral NIN result. Whatever vendor sits behind verifyNIN must
 * map into this shape; nothing outside this file knows the vendor's fields.
 */
export interface NINVerificationResult {
  nin: string;
  firstName: string;
  lastName: string;
  middleName: string;
  phone: string;
  gender: string;
  /** Any format parseDateOfBirth() accepts (DVP: YYYY-MM-DD). */
  dateOfBirth: string;
}

interface DvpNinRecord {
  nin: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  mobile?: string | null;
  gender: string;
  date_of_birth: string;
}

/**
 * Verifies a single NIN against the DVP (POST /identity/nin). Throws an
 * operational error (message + statusCode) on not-found/invalid/unavailable.
 */
const verifyNIN = async (nin: string): Promise<NINVerificationResult> => {
  const record = await dvpPost<DvpNinRecord>(
    "/identity/nin",
    { nin },
    "NIN not found. Please ensure your 11-digit NIN is correct and try again.",
  );

  return {
    nin: record.nin,
    firstName: record.first_name,
    lastName: record.last_name,
    middleName: record.middle_name ?? "",
    phone: record.mobile ?? "",
    gender: record.gender,
    dateOfBirth: record.date_of_birth,
  };
};

export default verifyNIN;
