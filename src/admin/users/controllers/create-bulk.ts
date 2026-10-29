import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import createAdminUsersBulkService from "../services/create-bulk.service";

const createBulk = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await createAdminUsersBulkService(request.adminUser!.role, request.body.users);
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default createBulk;
