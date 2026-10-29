import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import updateProfileService from "../services/update-profile.service";

const updateProfile = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await updateProfileService(
      request.adminUser!.id,
      request.adminUser!.role,
      request.params.id,
      request.body,
    );
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default updateProfile;
