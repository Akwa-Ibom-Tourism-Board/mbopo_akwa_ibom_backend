import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import createAdminUserService from "../services/create.service";

const create = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await createAdminUserService(request.adminUser!.role, request.body);
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default create;
