import { Request, Response } from "express";
import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { forgotPasswordService } from "../services/password-reset.service";

const forgotPassword = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await forgotPasswordService(request.body.email);

    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default forgotPassword;
