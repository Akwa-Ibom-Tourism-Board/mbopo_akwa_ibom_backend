import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import uploadSignatureService from "../services/upload-signature.service";

const uploadSignature = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await uploadSignatureService(request.body.scope, request.body.id, request.body.slot);
    return responseUtilities.responseHandler(response, result.message, result.statusCode, result.data);
  },
);

export default uploadSignature;
