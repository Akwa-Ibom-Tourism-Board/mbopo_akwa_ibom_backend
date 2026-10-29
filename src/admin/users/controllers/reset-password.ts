import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import resetAdminUserPasswordService from "../services/reset-password.service";

const resetPassword = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await resetAdminUserPasswordService(request.params.id);
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default resetPassword;
