import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import listContestantsService from "../services/list.service";

const list = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await listContestantsService(
      request.adminUser!.role,
      request.validatedQuery ?? {},
    );
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default list;
