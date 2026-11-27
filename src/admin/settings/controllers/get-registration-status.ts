import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import getRegistrationStatusService from "../services/get-registration-status.service";

const getRegistrationStatus = errorUtilities.withControllerErrorHandling(
  async (_request: Request, response: Response) => {
    const result = await getRegistrationStatusService();
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default getRegistrationStatus;
