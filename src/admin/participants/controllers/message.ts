import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import messageParticipantService from "../services/message.service";

const message = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await messageParticipantService(
      request.adminUser!.id,
      request.params.id,
      request.body.subject,
      request.body.body,
    );
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default message;
