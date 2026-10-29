import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import listSponsorsService from "../services/list-sponsors.service";

const listSponsors = errorUtilities.withControllerErrorHandling(
  async (_request: Request, response: Response) => {
    const result = await listSponsorsService();
    return responseUtilities.responseHandler(response, result.message, result.statusCode, result.data);
  },
);

export default listSponsors;
