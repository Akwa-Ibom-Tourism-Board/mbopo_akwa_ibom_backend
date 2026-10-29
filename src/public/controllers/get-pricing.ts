import { Request, Response } from "express";
import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import getPricingService from "../services/get-pricing.service";

const getPricing = errorUtilities.withControllerErrorHandling(async (_request: Request, response: Response) => {
  const result = await getPricingService();
  return responseUtilities.responseHandler(response, result.message, result.statusCode, result.data);
});

export default getPricing;
