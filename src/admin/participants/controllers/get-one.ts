import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import getParticipantService from "../services/get-one.service";

const getOne = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await getParticipantService(request.adminUser!.role, request.params.id);
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default getOne;
