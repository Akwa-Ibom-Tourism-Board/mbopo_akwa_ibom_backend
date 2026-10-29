import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import deleteSponsorService from "../services/delete-sponsor.service";

const deleteSponsor = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await deleteSponsorService(request.adminUser!.id, request.params.id);
    return responseUtilities.responseHandler(response, result.message, result.statusCode, result.data);
  },
);

export default deleteSponsor;
