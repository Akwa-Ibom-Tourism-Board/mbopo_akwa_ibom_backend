import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import disqualifyService from "../services/disqualify.service";

const disqualify = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await disqualifyService(request.body.applicationIds, request.body.reason);
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default disqualify;
