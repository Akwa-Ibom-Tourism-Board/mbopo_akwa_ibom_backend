import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import getParticipantsCountsService from "../services/get-all-count.service";

const getParticipantsCounts = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await getParticipantsCountsService(request.adminUser!.role);
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default getParticipantsCounts;
