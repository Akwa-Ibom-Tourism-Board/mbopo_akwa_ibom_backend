import { Request, Response } from "express";
import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import logoutService from "../services/logout.service";

const logout = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await logoutService(request.user!.id);

    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default logout;
