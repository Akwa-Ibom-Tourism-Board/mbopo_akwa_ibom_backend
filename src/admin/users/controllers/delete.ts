import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import deleteAdminUserService from "../services/delete.service";

const deleteAdminUser = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await deleteAdminUserService(
      request.adminUser!.id,
      request.adminUser!.role,
      request.params.id,
    );
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default deleteAdminUser;
