import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import getFinalizeStatusService from "../services/get-finalize-status.service";
import type { PhaseId } from "../phases.config";

const getFinalizeStatus = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await getFinalizeStatusService(request.params.phase as PhaseId);
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default getFinalizeStatus;
