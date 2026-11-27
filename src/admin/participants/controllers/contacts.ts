import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import getContactsService from "../services/contacts.service";

const contacts = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await getContactsService(request.validatedQuery ?? {});
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default contacts;
