import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import getPhaseStatesService from "../services/get-phase-states.service";

const getPhaseStates = errorUtilities.withControllerErrorHandling(
  async (_request: Request, response: Response) => {
    const result = await getPhaseStatesService();
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default getPhaseStates;
