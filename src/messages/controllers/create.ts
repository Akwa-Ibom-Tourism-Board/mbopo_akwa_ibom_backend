import { Request, Response } from "express";
import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import createMessageService from "../services/create.service";

const createMessage = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await createMessageService(request.body);

    return responseUtilities.responseHandler(response, result.message, result.statusCode);
  },
);

export default createMessage;
