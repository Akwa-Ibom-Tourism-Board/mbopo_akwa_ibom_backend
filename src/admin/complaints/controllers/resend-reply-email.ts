import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import resendReplyEmailService from "../services/resend-reply-email.service";

const resendReplyEmail = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await resendReplyEmailService(request.params.id, request.params.replyId);
    return responseUtilities.responseHandler(response, result.message, result.statusCode, result.data);
  },
);

export default resendReplyEmail;
