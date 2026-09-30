import { Request, Response } from "express";
import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import listNotificationsService from "../services/list.service";

const list = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const { page, limit } = request.validatedQuery || {};
    const result = await listNotificationsService(request.user!.id, {
      page,
      limit,
    });

    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default list;
