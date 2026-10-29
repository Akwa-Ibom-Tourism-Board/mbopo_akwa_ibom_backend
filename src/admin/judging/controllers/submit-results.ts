import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import submitResultsService from "../services/submit-results.service";
import type { PhaseId } from "../phases.config";

const submitResults = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await submitResultsService(
      request.adminUser!.id,
      request.adminUser!.role,
      request.params.phase as PhaseId,
      request.body.passedIds,
    );
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default submitResults;
