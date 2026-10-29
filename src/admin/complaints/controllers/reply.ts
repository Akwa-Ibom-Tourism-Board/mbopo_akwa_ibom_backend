import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import replyToComplaintService from "../services/reply.service";

const reply = errorUtilities.withControllerErrorHandling(async (request: Request, response: Response) => {
  const result = await replyToComplaintService(
    request.adminUser!.id,
    request.params.id,
    request.body.body,
  );
  return responseUtilities.responseHandler(response, result.message, result.statusCode, result.data);
});

export default reply;
