import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import documentSignatureService from "../services/document-signature.service";

const documentSignature = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await documentSignatureService(request.params.id, request.body.field);
    return responseUtilities.responseHandler(response, result.message, result.statusCode, result.data);
  },
);

export default documentSignature;
