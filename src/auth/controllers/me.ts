import { Request, Response } from "express";
import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { meService } from "../services/me.service";

const me = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await meService(request.user!.id);

    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default me;
