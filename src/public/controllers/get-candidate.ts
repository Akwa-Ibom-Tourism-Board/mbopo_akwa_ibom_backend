import { Request, Response } from "express";
import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import getCandidateService from "../services/get-candidate.service";

const getCandidate = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await getCandidateService(request.params.id);
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default getCandidate;
