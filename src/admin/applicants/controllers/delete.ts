import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import deleteApplicantService from "../services/delete.service";

const deleteApplicant = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await deleteApplicantService(request.params.id);
    return responseUtilities.responseHandler(response, result.message, result.statusCode);
  },
);

export default deleteApplicant;
