import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import uploadPhotoService from "../services/upload-photo.service";

const uploadPhoto = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const { field, url, publicId } = request.body;
    const result = await uploadPhotoService(request.user!.id, { field, url, publicId });

    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default uploadPhoto;
