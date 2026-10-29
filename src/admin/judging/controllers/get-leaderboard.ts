import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import getLeaderboardService from "../services/get-leaderboard.service";
import type { PhaseId } from "../phases.config";

const getLeaderboard = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await getLeaderboardService(
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

export default getLeaderboard;
