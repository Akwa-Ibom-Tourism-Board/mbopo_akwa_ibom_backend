import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import updateComplaintStatusService from "../services/update-status.service";

const updateStatus = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await updateComplaintStatusService(
      request.adminUser!.id,
      request.params.id,
      request.body.status,
    );
    return responseUtilities.responseHandler(response, result.message, result.statusCode, result.data);
  },
);

export default updateStatus;
