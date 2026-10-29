import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import adminLogoutService from "../services/logout.service";

const logout = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await adminLogoutService(request.adminUser!.id);

    return responseUtilities.responseHandler(response, result.message, result.statusCode);
  },
);

export default logout;
