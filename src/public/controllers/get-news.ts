import { Request, Response } from "express";
import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import getNewsService from "../services/get-news.service";

const getNews = errorUtilities.withControllerErrorHandling(async (_request: Request, response: Response) => {
  const result = await getNewsService();
  return responseUtilities.responseHandler(response, result.message, result.statusCode, result.data);
});

export default getNews;
