import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import openPhaseService from "../services/open-phase.service";
import type { PhaseId } from "../../judging/phases.config";

const openPhase = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await openPhaseService(request.adminUser!.id, request.params.phase as PhaseId);
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default openPhase;
