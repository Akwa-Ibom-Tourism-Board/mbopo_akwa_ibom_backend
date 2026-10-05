import { dvpPostWithEnvelope } from "./dvp-client";

export interface VerifyNinInput {
  nin: string;
  firstName: string;
  lastName: string;
  /** Base64 data URI of the live selfie. */
  image: string;
  /** Always true — not a caller-controlled toggle. */
  mustCheckImage: true;
}

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
  /** Provider-hosted photo from the NIN record. */
  photoUrl: string | null;
  /** State from the NIN record's address, e.g. "Akwa Ibom". */
  addressState: string | null;
  /** Face-match outcome; null when the provider returned none. */
  selfieMatch: boolean | null;
}

interface DvpNinRecord {
  nin: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  mobile?: string | null;
  gender: string;
  date_of_birth: string;
  image?: string | null;
  address?: { state?: string | null } | null;
}

/**
 * Verifies a NIN plus a live selfie against the DVP (POST /identity/nin).
 * Throws an operational error (message + statusCode) on not-found / invalid
 * / unavailable. middleName is never sent (not a DVP param).
 */
const verifyNIN = async (input: VerifyNinInput): Promise<NINVerificationResult> => {
  const { record, envelope } = await dvpPostWithEnvelope<DvpNinRecord>(
    "/identity/nin",
    {
      nin: input.nin,
      first_name: input.firstName,
      last_name: input.lastName,
      must_check_image: true,
      image: input.image,
    },
    "NIN not found. Please ensure your 11-digit NIN is correct and try again.",
  );

  const selfie = (envelope.validations as any)?.selfie?.match;

  return {
    nin: record.nin,
    firstName: record.first_name,
    lastName: record.last_name,
    middleName: record.middle_name ?? "",
    phone: record.mobile ?? "",
    gender: record.gender,
    dateOfBirth: record.date_of_birth,
    photoUrl: record.image ?? null,
    addressState: record.address?.state ?? null,
    selfieMatch: typeof selfie === "boolean" ? selfie : null,
  };
};

export default verifyNIN;
