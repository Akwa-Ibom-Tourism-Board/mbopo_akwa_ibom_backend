import { Request, Response } from "express";
import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import changePasswordService from "../services/change-password.service";

const changePassword = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const { currentPassword, newPassword } = request.body;
    const result = await changePasswordService(request.user!.id, currentPassword, newPassword);

    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default changePassword;
