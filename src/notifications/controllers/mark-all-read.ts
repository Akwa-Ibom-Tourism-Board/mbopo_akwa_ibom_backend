import { Request, Response } from "express";
import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import markAllReadService from "../services/mark-all-read.service";

const markAllRead = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await markAllReadService(request.user!.id);

    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default markAllRead;
