import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import setAdminUserActiveService from "../services/set-active.service";

const setActive = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await setAdminUserActiveService(
      request.adminUser!.id,
      request.params.id,
      request.body.active,
    );
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default setActive;
