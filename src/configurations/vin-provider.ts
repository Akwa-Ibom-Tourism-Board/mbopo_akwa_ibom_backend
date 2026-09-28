import errorUtilities from "./error-handler";
import { StatusCodes } from "./statusCodes";

export interface VINVerificationResult {
  vin: string;
  lga?: string;
  ward?: string;
  state?: string;
  firstName?: string;
  lastName?: string;
}

/**
 * TODO: wire to a real VIN-verification provider once one is chosen.
 * Contract this function MUST satisfy once implemented:
 *   input:  a 19-character INEC Voter Identification Number
 *   output: { vin, lga, ward, state, firstName?, lastName? }
 * `state` (or `lga`, checked against AKWA_IBOM_LGAS) is what
 * auth.helpers's isAkwaIbomIndigene() uses — see §8 of BUILD_ME.md.
 */
const verifyVIN = async (_vin: string): Promise<VINVerificationResult> => {
  throw errorUtilities.createError(
    "VIN verification is not yet configured. Set VIN_PROVIDER_BASE_URL and VIN_PROVIDER_API_KEY once a provider is chosen.",
    StatusCodes.SERVICE_UNAVAILABLE,
  );
};

export default verifyVIN;
