import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import photoSignatureService from "../services/photo-signature.service";

const photoSignature = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await photoSignatureService(request.params.id);
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default photoSignature;
