import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import saveDraftService from "../services/save-draft.service";

const saveDraft = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    console.log('checks', request.user!.id, request.body)
    const result = await saveDraftService(request.user!.id, request.body);

    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default saveDraft;
