import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { StatusCodes } from "../../configurations/statusCodes";
import verifyNIN from "../../configurations/nin-provider";
import verifyVIN, {
  VINVerificationResult,
} from "../../configurations/vin-provider";
import {
  parseDateOfBirth,
  isEligibleAge,
  isAkwaIbomIndigene,
} from "../auth.helpers";
import { Gender } from "../User";
import { namesMatch } from "../name-match";

export interface VerifiedIdentity {
  nin: string;
  vin: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string;
  localGovernment: string;
  ward: string;
}

export interface EligibilityCheckResult {
  eligible: boolean;
  reasons: string[];
  identity: VerifiedIdentity;
}

interface CacheEntry {
  identity: VerifiedIdentity;
  vinResult: VINVerificationResult;
  sameName: boolean;
  expiresAt: number;
}

// Short-lived, advisory-only cache: a user who checks eligibility and then
// immediately registers shouldn't trigger a second billable NIN/VIN lookup
// for the same pair. §8's eligibility checks are always re-run against the
// cached result at registration time regardless of whether it was cached.
const IDENTITY_CACHE_TTL_MS = 5 * 60 * 1000;
const identityCache = new Map<string, CacheEntry>();

const cacheKey = (nin: string, vin: string) => `${nin}:${vin}`;

/**
 * Calls the NIN and VIN providers (or reuses a recent cached result) and
 * maps their raw shapes into this project's internal identity shape.
 */
const lookupIdentity = async (
  nin: string,
  vin: string,
): Promise<{
  identity: VerifiedIdentity;
  vinResult: VINVerificationResult;
  sameName: boolean;
}> => {
  const cached = identityCache.get(cacheKey(nin, vin));
  if (cached && cached.expiresAt > Date.now()) {
    return {
      identity: cached.identity,
      vinResult: cached.vinResult,
      sameName: cached.sameName,
    };
  }

  const [ninResult, vinResult] = await Promise.all([
    verifyNIN(nin),
    verifyVIN(vin),
  ]);

  const dateOfBirth = parseDateOfBirth(ninResult.dateOfBirth);
  if (!dateOfBirth) {
    throw errorUtilities.createError(
      "NIN record has an invalid date of birth",
      StatusCodes.BAD_REQUEST,
    );
  }

  const identity: VerifiedIdentity = {
    nin,
    vin,
    firstName: ninResult.firstName,
    lastName: ninResult.lastName,
    gender:
      ninResult.gender?.toLowerCase() === "female"
        ? Gender.Female
        : Gender.Male,
    dateOfBirth,
    localGovernment: vinResult.lga || vinResult.state || "",
    ward: vinResult.ward || "",
  };

  // Guards against pairing one person's NIN with someone else's VIN. Both
  // lookups already return names, so this costs no extra provider call.
  const sameName = namesMatch(
    {
      firstName: ninResult.firstName,
      middleName: ninResult.middleName,
      lastName: ninResult.lastName,
    },
    { firstName: vinResult.firstName, lastName: vinResult.lastName },
  );

  identityCache.set(cacheKey(nin, vin), {
    identity,
    vinResult,
    sameName,
    expiresAt: Date.now() + IDENTITY_CACHE_TTL_MS,
  });

  return { identity, vinResult, sameName };
};

/**
 * Runs the §8 eligibility rules (gender, age-by-calendar-year, Akwa Ibom
 * indigene) against a verified identity, collecting every failing reason
 * rather than short-circuiting on the first one. Shared by identity-check
 * and register.service.ts (which must never trust a client-resubmitted
 * identity and re-verifies here too).
 */
export const verifyAndEvaluateEligibility = async (
  nin: string,
  vin: string,
): Promise<EligibilityCheckResult> => {
  const { identity, vinResult, sameName } = await lookupIdentity(nin, vin);

  const reasons: string[] = [];

  if (!sameName) {
    reasons.push("The NIN and VIN provided do not appear to belong to the same person");
  }
  if (identity.gender !== Gender.Female) {
    reasons.push("Applicants must be female");
  }
  if (!isEligibleAge(identity.dateOfBirth)) {
    reasons.push("Applicants must be between 22 and 27 years old");
  }
  if (!isAkwaIbomIndigene(vinResult)) {
    reasons.push("Applicants must be an indigene of Akwa Ibom State");
  }

  return { eligible: reasons.length === 0, reasons, identity };
};

const identityCheckService = errorUtilities.withServiceErrorHandling(
  async (nin: string, vin: string) => {
    const result = await verifyAndEvaluateEligibility(nin, vin);

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Identity check complete",
      result,
    );
  },
);

export default identityCheckService;
