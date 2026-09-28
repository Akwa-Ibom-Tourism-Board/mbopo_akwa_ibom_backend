import { Request, Response } from "express";
import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { loginRequestOtpService } from "../services/login-otp.service";

const loginRequestOtp = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await loginRequestOtpService(request.body.email);

    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default loginRequestOtp;
