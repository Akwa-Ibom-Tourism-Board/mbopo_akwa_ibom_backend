import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import getTiersService from "../services/get-tiers.service";

const getTiers = errorUtilities.withControllerErrorHandling(async (_request: Request, response: Response) => {
  const result = await getTiersService();
  return responseUtilities.responseHandler(response, result.message, result.statusCode, result.data);
});

export default getTiers;
