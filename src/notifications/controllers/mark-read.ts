import { Request, Response } from "express";
import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import markReadService from "../services/mark-read.service";

const markRead = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await markReadService(request.user!.id, request.params.id as string);

    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default markRead;
