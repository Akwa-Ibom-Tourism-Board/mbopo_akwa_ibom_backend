import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import getMyScoresService from "../services/get-my-scores.service";

const getMyScores = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const query = request.validatedQuery ?? {};
    const result = await getMyScoresService(request.adminUser!.id, {
      applicationId: query.applicationId,
      phase: query.phase,
    });
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default getMyScores;
