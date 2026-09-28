import { Request, Response } from "express";
import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { resetPasswordService } from "../services/password-reset.service";

const resetPassword = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const { token, password } = request.body;
    const result = await resetPasswordService(token, password);

    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default resetPassword;
