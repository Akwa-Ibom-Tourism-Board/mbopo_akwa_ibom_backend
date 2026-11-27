import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import updateRegistrationStatusService from "../services/update-registration-status.service";
import type { RegistrationStatus } from "../../../registration/RegistrationSetting";

const updateRegistrationStatus = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await updateRegistrationStatusService(
      request.adminUser!.id,
      request.body.status as RegistrationStatus,
    );
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default updateRegistrationStatus;
