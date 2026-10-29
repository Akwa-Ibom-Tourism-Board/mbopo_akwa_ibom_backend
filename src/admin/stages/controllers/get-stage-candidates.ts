import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import getStageCandidatesService from "../services/get-stage-candidates.service";
import type { PhaseId } from "../../judging/phases.config";

const getStageCandidates = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await getStageCandidatesService(
      request.adminUser!.role,
      request.params.phase as PhaseId,
    );
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default getStageCandidates;
