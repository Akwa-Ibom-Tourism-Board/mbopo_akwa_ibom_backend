import { Request, Response } from "express";
import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import listCandidatesService from "../services/list-candidates.service";

const listCandidates = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await listCandidatesService(request.validatedQuery ?? {});
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default listCandidates;
