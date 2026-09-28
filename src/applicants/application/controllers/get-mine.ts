import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import getMineService from "../services/get-mine.service";

const getMine = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await getMineService(request.user!.id);

    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default getMine;
