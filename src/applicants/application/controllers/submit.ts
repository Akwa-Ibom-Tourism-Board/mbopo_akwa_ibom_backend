import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import submitService from "../services/submit.service";

const submit = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await submitService(request.user!.id, request.body);

    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default submit;
