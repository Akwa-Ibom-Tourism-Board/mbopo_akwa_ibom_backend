import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import getJudgesService from "../services/get-judges.service";
import type { PhaseId } from "../phases.config";

const getJudges = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await getJudgesService(request.params.phase as PhaseId);
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default getJudges;
