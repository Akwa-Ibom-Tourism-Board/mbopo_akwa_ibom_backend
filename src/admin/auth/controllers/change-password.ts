import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import adminChangePasswordService from "../services/change-password.service";

const changePassword = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const { currentPassword, newPassword } = request.body;
    const result = await adminChangePasswordService(
      request.adminUser!.id,
      currentPassword,
      newPassword,
    );

    return responseUtilities.responseHandler(response, result.message, result.statusCode);
  },
);

export default changePassword;
