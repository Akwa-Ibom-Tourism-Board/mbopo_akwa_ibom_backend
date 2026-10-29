import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import listActivityForCandidateService from "../services/list-for-candidate.service";

const listForCandidate = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await listActivityForCandidateService(
      request.adminUser!.role,
      request.params.id,
    );
    return responseUtilities.responseHandler(response, result.message, result.statusCode, result.data);
  },
);

export default listForCandidate;
