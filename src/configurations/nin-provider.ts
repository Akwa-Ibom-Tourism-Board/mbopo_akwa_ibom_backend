import axios from "axios";
import configurations from ".";
import errorUtilities from "./error-handler";
import { StatusCodes } from "./statusCodes";

export interface NINVerificationResult {
  nin: string;
  firstname: string;
  lastname: string;
  middlename: string;
  phone: string;
  gender: string;
  birthdate: string;
  photo: string;
  residence: {
    address1: string;
    town: string;
    lga: string;
    state: string;
  };
}

/**
 * Calls the LumiID NIN-verification provider for a single NIN.
 * Throws a friendly, operational-style error (message + statusCode) on any
 * provider-side rejection (not found / invalid / unavailable). Returns the
 * raw LumiID shape — mapping into this project's internal identity shape
 * happens in the calling service, not here.
 */
const verifyNIN = async (nin: string): Promise<NINVerificationResult> => {
  try {
    const response = await axios.post(
      `${configurations.LUMIID_BASE_URL}/v1/ng/nin-basic/`,
      { nin },
      {
        headers: {
          Authorization: `Bearer ${configurations.LUMIID_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = response.data;

    if (!data.success) {
      throw errorUtilities.createError(
        data.message || "NIN verification failed, check NIN and try again",
        StatusCodes.BAD_REQUEST,
      );
    }

    return data.data;
  } catch (error: any) {
    if (error.isOperational) {
      throw error;
    }

    if (axios.isAxiosError(error) && error.response) {
      const lumiidError = error.response.data;

      const errorMessages: Record<string, string> = {
        NIN_NOT_FOUND:
          "NIN not found. Please ensure your 11-digit NIN is correct and try again.",
        INVALID_NIN: "The NIN provided is invalid. Please check and try again.",
        SERVICE_UNAVAILABLE:
          "NIN verification service is temporarily unavailable. Please try again later.",
      };

      const friendlyMessage =
        errorMessages[lumiidError?.code] ||
        lumiidError?.message ||
        "NIN verification failed. Please check your NIN and try again.";

      throw errorUtilities.createError(friendlyMessage, StatusCodes.BAD_REQUEST);
    }
    throw error;
  }
};

export default verifyNIN;
