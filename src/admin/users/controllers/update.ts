import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import updateAdminUserService from "../services/update.service";

const update = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await updateAdminUserService(
      request.adminUser!.role,
      request.adminUser!.id,
      request.params.id,
      request.body,
    );
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default update;
