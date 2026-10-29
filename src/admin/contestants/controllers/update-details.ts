import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import updateDetailsService from "../services/update-details.service";

const updateDetails = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await updateDetailsService(
      request.adminUser!.id,
      request.adminUser!.role,
      request.params.id,
      request.body,
    );
    return responseUtilities.responseHandler(response, result.message, result.statusCode, result.data);
  },
);

export default updateDetails;
