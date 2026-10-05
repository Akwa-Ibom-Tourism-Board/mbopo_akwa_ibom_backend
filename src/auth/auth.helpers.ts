import bcrypt from "bcryptjs";
import crypto from "crypto";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import type { User } from "./User";
import { AKWA_IBOM_LGAS, MINIMUM_ELIGIBLE_AGE, MAXIMUM_ELIGIBLE_AGE } from "../configurations/constants";

dayjs.extend(customParseFormat);

// NIN providers/date pickers hand this back in whatever format they feel
// like (LumiID uses DD-MM-YYYY) — accept the common ones and normalize to
// the DATEONLY-friendly YYYY-MM-DD before it ever reaches Joi or the model.
const DATE_OF_BIRTH_FORMATS = ["YYYY-MM-DD", "DD-MM-YYYY", "DD/MM/YYYY", "YYYY/MM/DD"];

export const parseDateOfBirth = (value: string): string | null => {
  const trimmed = value.trim();
  const parsed = dayjs(trimmed, DATE_OF_BIRTH_FORMATS, true);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : null;
};

/** Title-cases a person's name — every word gets Capitalized First Letter. */
export const toTitleCase = (value: string | null | undefined): string | null | undefined => {
  if (value === null || value === undefined) return value;

  const collapsed = value.trim().replace(/\s+/g, " ");
  if (collapsed === "") return collapsed;

  return collapsed
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const generateNumericOtp = (length = 6): string => {
  const max = 10 ** length;
  const otp = crypto.randomInt(0, max).toString();
  return otp.padStart(length, "0");
};

export const generateUrlToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

// Deterministic (unlike bcrypt) so a reset token can be looked up by its hash
// directly in a WHERE clause, instead of scanning every user's bcrypt hash.
export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const hashData = async (value: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(value, salt);
};

export const compareHash = async (value: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(value, hash);
};

export const serializeUser = (user: User) => {
  const json: any = user.toJSON();
  return {
    id: json.id,
    email: json.email,
    avatarUrl: json.avatarUrl ?? null,
    emailVerified: json.emailVerified,
    identityVerified: json.identityVerified,
    firstName: json.firstName ?? null,
    lastName: json.lastName ?? null,
    phoneNumber: json.phoneNumber ?? null,
    nin: json.nin ?? null,
    vin: json.vin ?? null,
    gender: json.gender ?? null,
    dateOfBirth: json.dateOfBirth ?? null,
    localGovernment: json.localGovernment ?? null,
    ward: json.ward ?? null,
    createdAt: json.createdAt,
  };
};

/**
 * Deliberate calendar-year-only age calculation, not a day/month-aware
 * date-diff: a person born in December still counts as turning that age on
 * Jan 1 of the relevant year for this program. See BUILD_ME.md §8.
 */
export function ageByYear(dateOfBirth: string): number {
  return new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
}

export function isEligibleAge(dateOfBirth: string): boolean {
  const age = ageByYear(dateOfBirth);
  return age >= MINIMUM_ELIGIBLE_AGE && age <= MAXIMUM_ELIGIBLE_AGE;
}

/** Minimal shape both VIN and NIN results satisfy. */
export interface IndigeneCheckInput {
  state?: string | undefined;
  lga?: string | undefined;
}

// A blank/missing source fails closed (not an indigene). Comparison is
// trimmed and case-insensitive since two upstream sources now feed it.
export function isAkwaIbomIndigene(input: IndigeneCheckInput): boolean {
  if (input.state?.trim()) {
    return input.state.trim().toLowerCase() === "akwa ibom";
  }
  if (input.lga?.trim()) {
    return (AKWA_IBOM_LGAS as readonly string[]).includes(input.lga.trim());
  }
  return false;
}
