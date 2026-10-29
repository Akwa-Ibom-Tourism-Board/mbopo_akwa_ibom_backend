import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import listNewsService from "../services/list-news.service";

const listNews = errorUtilities.withControllerErrorHandling(async (_request: Request, response: Response) => {
  const result = await listNewsService();
  return responseUtilities.responseHandler(response, result.message, result.statusCode, result.data);
});

export default listNews;
