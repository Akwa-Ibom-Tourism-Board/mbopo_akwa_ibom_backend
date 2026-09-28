import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import uploadPhotoService from "../services/upload-photo.service";

const uploadPhoto = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    if (!request.file) {
      return responseUtilities.responseHandler(
        response,
        "No file uploaded",
        StatusCodes.BAD_REQUEST,
      );
    }

    const result = await uploadPhotoService(
      request.user!.id,
      request.body.field,
      request.file,
    );

    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default uploadPhoto;
