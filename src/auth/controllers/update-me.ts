import { Request, Response } from "express";
import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { updateMeService } from "../services/me.service";

const updateMe = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await updateMeService(request.user!.id, request.body);

    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default updateMe;
