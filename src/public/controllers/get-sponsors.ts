import { Request, Response } from "express";
import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import getSponsorsService from "../services/get-sponsors.service";

const getSponsors = errorUtilities.withControllerErrorHandling(
  async (_request: Request, response: Response) => {
    const result = await getSponsorsService();
    return responseUtilities.responseHandler(response, result.message, result.statusCode, result.data);
  },
);

export default getSponsors;
