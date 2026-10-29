import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import reassignComplaintService from "../services/reassign.service";

const reassign = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await reassignComplaintService(
      request.adminUser!.id,
      request.params.id,
      request.body.assignedToId,
    );
    return responseUtilities.responseHandler(response, result.message, result.statusCode, result.data);
  },
);

export default reassign;
