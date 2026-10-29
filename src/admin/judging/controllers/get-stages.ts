import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import getStagesService from "../services/get-stages.service";

const getStages = errorUtilities.withControllerErrorHandling(
  async (_request: Request, response: Response) => {
    const result = await getStagesService();
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default getStages;
