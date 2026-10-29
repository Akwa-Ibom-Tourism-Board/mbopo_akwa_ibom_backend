import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import saveScoreService from "../services/save-score.service";

const saveScore = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await saveScoreService(request.adminUser!.id, request.body);
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default saveScore;
