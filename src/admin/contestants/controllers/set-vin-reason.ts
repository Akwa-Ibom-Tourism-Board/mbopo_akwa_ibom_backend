import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import setVinReasonService from "../services/set-vin-reason.service";

const setVinReason = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await setVinReasonService(
      request.adminUser!.id,
      request.adminUser!.role,
      request.params.id,
      request.body.reason,
    );
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default setVinReason;
