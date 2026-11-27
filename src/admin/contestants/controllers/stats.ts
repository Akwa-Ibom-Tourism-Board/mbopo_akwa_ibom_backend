import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import statsService from "../services/stats.service";

const stats = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await statsService(request.adminUser!.role);
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default stats;
