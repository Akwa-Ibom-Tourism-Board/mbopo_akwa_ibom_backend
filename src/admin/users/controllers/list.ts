import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import listAdminUsersService from "../services/list.service";

const list = errorUtilities.withControllerErrorHandling(
  async (_request: Request, response: Response) => {
    const result = await listAdminUsersService();
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default list;
