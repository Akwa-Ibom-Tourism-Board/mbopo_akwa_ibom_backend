import { Request, Response } from "express";
import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import loginService from "../services/login.service";

const login = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const { email, password } = request.body;
    const result = await loginService(email, password);

    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default login;
