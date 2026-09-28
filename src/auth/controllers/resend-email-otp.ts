import { Request, Response } from "express";
import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import resendEmailOtpService from "../services/resend-email-otp.service";

const resendEmailOtp = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await resendEmailOtpService(request.body.email);

    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default resendEmailOtp;
