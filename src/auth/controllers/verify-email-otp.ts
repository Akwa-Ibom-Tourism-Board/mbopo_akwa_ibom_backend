import { Request, Response } from "express";
import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import verifyEmailOtpService from "../services/verify-email-otp.service";

const verifyEmailOtp = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const { email, otp } = request.body;
    const result = await verifyEmailOtpService(email, otp);

    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default verifyEmailOtp;
