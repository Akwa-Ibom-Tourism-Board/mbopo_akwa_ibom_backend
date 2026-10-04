import axios from "axios";
import configurations from ".";
import errorUtilities from "./error-handler";
import { StatusCodes } from "./statusCodes";

// Shared transport for the Akwa Ibom Data Verification Portal (DVP). Only
// nin-provider.ts and vin-provider.ts talk to it; to change vendors, replace
// the body of those two functions and keep their exported result types.
const REQUEST_TIMEOUT_MS = 15_000;

export interface DvpEnvelope<T> {
  success: boolean;
  message?: string;
  data?: { data: T } & Record<string, unknown>;
}

export const dvpPost = async <T>(
  path: string,
  body: Record<string, unknown>,
  notFoundMessage: string,
): Promise<T> => {
  const { DVP_BASE_URL, DVP_SECRET_KEY, DVP_PROGRAM_ID } = configurations;
  if (!DVP_BASE_URL || !DVP_SECRET_KEY || !DVP_PROGRAM_ID) {
    throw errorUtilities.createError(
      "Identity verification is not configured",
      StatusCodes.SERVICE_UNAVAILABLE,
    );
  }

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
      },
    );

    const record = response.data?.data?.data;
    if (!response.data?.success || !record) {
      throw errorUtilities.createError(notFoundMessage, StatusCodes.BAD_REQUEST);
    }
    return record;
  } catch (error: any) {
    if (error.isOperational) throw error;

    if (axios.isAxiosError(error) && error.response) {
      const status = error.response.status;
      // Our own credential/program problems or provider outages are not the
      // user's fault — never surface them as "check your number".
      if (status === 401 || status === 403 || status >= 500) {
        console.error(`DVP ${path} failed with ${status}`);
        throw errorUtilities.createError(
          "Identity verification service is temporarily unavailable. Please try again later.",
          StatusCodes.SERVICE_UNAVAILABLE,
        );
      }
      throw errorUtilities.createError(notFoundMessage, StatusCodes.BAD_REQUEST);
    }

    if (axios.isAxiosError(error)) {
      throw errorUtilities.createError(
        "Identity verification service is temporarily unavailable. Please try again later.",
        StatusCodes.SERVICE_UNAVAILABLE,
      );
    }
    throw error;
  }
};
