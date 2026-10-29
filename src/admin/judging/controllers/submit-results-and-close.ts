import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import submitResultsAndCloseService from "../services/submit-results-and-close.service";
import type { PhaseId } from "../phases.config";

const submitResultsAndClose = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await submitResultsAndCloseService(
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

export default submitResultsAndClose;
