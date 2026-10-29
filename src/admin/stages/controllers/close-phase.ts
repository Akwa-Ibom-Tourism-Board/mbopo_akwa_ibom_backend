import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import closePhaseService from "../services/close-phase.service";
import type { PhaseId } from "../../judging/phases.config";

const closePhase = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await closePhaseService(request.adminUser!.id, request.params.phase as PhaseId);
    return responseUtilities.responseHandler(response, result.message, result.statusCode);
  },
);

export default closePhase;
