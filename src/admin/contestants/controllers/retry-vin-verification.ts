import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import retryVinVerificationService from "../services/retry-vin-verification.service";

const retryVinVerification = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await retryVinVerificationService(
      request.adminUser!.id,
      request.adminUser!.role,
      request.params.id,
    );
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default retryVinVerification;
