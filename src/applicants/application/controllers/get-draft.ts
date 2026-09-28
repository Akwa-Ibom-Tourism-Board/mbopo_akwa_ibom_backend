import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import getDraftService from "../services/get-draft.service";

const getDraft = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await getDraftService(request.user!.id);

    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default getDraft;
