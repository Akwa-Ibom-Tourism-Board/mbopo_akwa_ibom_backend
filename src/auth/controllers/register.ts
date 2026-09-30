import { Request, Response } from "express";
import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import registerService from "../services/register.service";

const register = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await registerService(request.body);

    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default register;
