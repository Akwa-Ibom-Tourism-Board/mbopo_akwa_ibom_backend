import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import getResultsStandingsService from "../services/get-results-standings.service";
import type { PhaseId } from "../phases.config";

const getResultsStandings = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await getResultsStandingsService(
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

export default getResultsStandings;
