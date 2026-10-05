import { Request, Response } from "express";
import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import cloudinarySignatureService from "../services/cloudinary-signature.service";

const cloudinarySignature = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await cloudinarySignatureService(request.user!.id, request.body.field);

    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default cloudinarySignature;
