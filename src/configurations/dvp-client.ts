import axios from "axios";
import configurations from ".";
import errorUtilities from "./error-handler";
import { StatusCodes } from "./statusCodes";

// Shared transport for the Akwa Ibom Data Verification Portal (DVP). Only
// nin-provider.ts and vin-provider.ts talk to it; to change vendors, replace
// the body of those two functions and keep their exported result types.
const REQUEST_TIMEOUT_MS = 15_000;

const UNAVAILABLE_MESSAGE =
  "Identity verification service is temporarily unavailable. Please try again later.";
export const SELFIE_MISMATCH_MESSAGE =
  "Your photo does not match your NIN record. Please retake it and try again.";
export const SELFIE_MISMATCH_CODE = "SELFIE_MISMATCH";

// Best-effort: if DVP rejects a face check at the HTTP level (instead of
// returning validations.selfie.match = false), the only signal is its message
// text. Not a confirmed contract — verify against the live API.
const SELFIE_KEYWORDS = /selfie|face|photo|image/i;

export interface DvpEnvelope<T> {
  success: boolean;
  message?: string;
  data?: { data: T } & Record<string, unknown>;
}

export interface DvpResult<T> {
  record: T;
  /** Everything alongside `data` at the `data.data` level (e.g. `validations`). */
  envelope: Record<string, unknown>;
}

export const dvpPostWithEnvelope = async <T>(
  path: string,
  body: Record<string, unknown>,
  notFoundMessage: string,
): Promise<DvpResult<T>> => {
  const { DVP_BASE_URL, DVP_SECRET_KEY, DVP_PROGRAM_ID } = configurations;
  if (!DVP_BASE_URL || !DVP_SECRET_KEY || !DVP_PROGRAM_ID) {
    throw errorUtilities.createError(
      "Identity verification is not configured",
      StatusCodes.SERVICE_UNAVAILABLE,
    );
  }

  const faceCheckRequested = body.must_check_image === true;
  const selfieMismatch = () => ({
    ...errorUtilities.createError(SELFIE_MISMATCH_MESSAGE, StatusCodes.BAD_REQUEST),
    code: SELFIE_MISMATCH_CODE,
  });
  const looksLikeSelfieFailure = (message: unknown) =>
    faceCheckRequested && typeof message === "string" && SELFIE_KEYWORDS.test(message);

  try {
    const response = await axios.post<DvpEnvelope<T>>(
      `${DVP_BASE_URL}${path}`,
      { program_id: DVP_PROGRAM_ID, ...body },
      {
        headers: {
          Authorization: `Bearer ${DVP_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: REQUEST_TIMEOUT_MS,
        // The selfie payload is ~1MB; don't let axios' default cap interfere.
        maxBodyLength: 5 * 1024 * 1024,
      },
    );

    const inner = response.data?.data;
    const record = inner?.data;
    if (!response.data?.success || !record) {
      if (looksLikeSelfieFailure(response.data?.message)) throw selfieMismatch();
      throw errorUtilities.createError(notFoundMessage, StatusCodes.BAD_REQUEST);
    }

    const { data: _record, ...envelope } = inner;
    return { record, envelope };
  } catch (error: any) {
    if (error.isOperational) throw error;

    if (axios.isAxiosError(error) && error.response) {
      const status = error.response.status;
      // Our own credential/program problems or provider outages are not the
      // user's fault — never surface them as "check your number".
      if (status === 401 || status === 403 || status >= 500) {
        console.error(`DVP ${path} failed with ${status}`);
        throw errorUtilities.createError(UNAVAILABLE_MESSAGE, StatusCodes.SERVICE_UNAVAILABLE);
      }
      if (looksLikeSelfieFailure((error.response.data as any)?.message)) throw selfieMismatch();
      throw errorUtilities.createError(notFoundMessage, StatusCodes.BAD_REQUEST);
    }

    if (axios.isAxiosError(error)) {
      throw errorUtilities.createError(UNAVAILABLE_MESSAGE, StatusCodes.SERVICE_UNAVAILABLE);
    }
    throw error;
  }
};

export const dvpPost = async <T>(
  path: string,
  body: Record<string, unknown>,
  notFoundMessage: string,
): Promise<T> => (await dvpPostWithEnvelope<T>(path, body, notFoundMessage)).record;
