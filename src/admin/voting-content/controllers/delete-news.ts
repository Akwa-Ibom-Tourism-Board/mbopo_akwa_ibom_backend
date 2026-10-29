import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import deleteNewsService from "../services/delete-news.service";

const deleteNews = errorUtilities.withControllerErrorHandling(async (request: Request, response: Response) => {
  const result = await deleteNewsService(request.adminUser!.id, request.params.id);
  return responseUtilities.responseHandler(response, result.message, result.statusCode, result.data);
});

export default deleteNews;
