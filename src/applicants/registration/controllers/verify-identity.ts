import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import verifyIdentityService from "../services/verify-identity.service";

const verifyIdentity = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const { nin, firstName, lastName, middleName, image } = request.body;
    const result = await verifyIdentityService(request.user!.id, {
      nin,
      firstName,
      lastName,
      middleName,
      image,
    });

    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default verifyIdentity;
