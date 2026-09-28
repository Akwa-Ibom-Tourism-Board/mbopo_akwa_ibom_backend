import { Request, Response } from "express";
import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import identityCheckService from "../services/identity-check.service";

const identityCheck = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const { nin, vin } = request.body;
    const result = await identityCheckService(nin, vin);

    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default identityCheck;
