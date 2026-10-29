import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import saveNewsService from "../services/save-news.service";

const saveNews = errorUtilities.withControllerErrorHandling(async (request: Request, response: Response) => {
  const result = await saveNewsService(request.adminUser!.id, request.body);
  return responseUtilities.responseHandler(response, result.message, result.statusCode, result.data);
});

export default saveNews;
