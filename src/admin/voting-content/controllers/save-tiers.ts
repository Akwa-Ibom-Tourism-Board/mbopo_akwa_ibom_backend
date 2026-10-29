import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import saveTiersService from "../services/save-tiers.service";

const saveTiers = errorUtilities.withControllerErrorHandling(async (request: Request, response: Response) => {
  const result = await saveTiersService(request.adminUser!.id, request.body.tiers);
  return responseUtilities.responseHandler(response, result.message, result.statusCode, result.data);
});

export default saveTiers;
