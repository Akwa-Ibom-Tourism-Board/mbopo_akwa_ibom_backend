import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import reopenPhaseService from "../services/reopen-phase.service";
import type { PhaseId } from "../../judging/phases.config";

const reopenPhase = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await reopenPhaseService(
      request.adminUser!.id,
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

export default reopenPhase;
