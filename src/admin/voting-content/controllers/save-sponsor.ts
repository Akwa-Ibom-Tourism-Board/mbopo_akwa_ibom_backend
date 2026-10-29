import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import saveSponsorService from "../services/save-sponsor.service";

const saveSponsor = errorUtilities.withControllerErrorHandling(async (request: Request, response: Response) => {
  const result = await saveSponsorService(request.adminUser!.id, request.body);
  return responseUtilities.responseHandler(response, result.message, result.statusCode, result.data);
});

export default saveSponsor;
