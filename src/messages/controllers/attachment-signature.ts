import { Request, Response } from "express";
import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import attachmentSignatureService from "../services/attachment-signature.service";

// Public (no auth) — anonymous visitors submitting the Ask Me widget mint
// their own submissionId client-side before any Message row exists.
const attachmentSignature = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await attachmentSignatureService(
      request.body.submissionId,
      request.body.slot,
    );
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default attachmentSignature;
