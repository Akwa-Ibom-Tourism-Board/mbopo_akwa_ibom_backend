import { Request, Response } from "express";
import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { loginVerifyOtpService } from "../services/login-otp.service";

const loginVerifyOtp = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const { email, otp } = request.body;
    const result = await loginVerifyOtpService(email, otp);

    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default loginVerifyOtp;
