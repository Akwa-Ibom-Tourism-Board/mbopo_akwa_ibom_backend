import { Request, Response } from "express";
import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { StatusCodes } from "../../configurations/statusCodes";
import uploadAvatarService from "../services/upload-avatar.service";

const uploadAvatar = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    if (!request.file) {
      return responseUtilities.responseHandler(
        response,
        "No file uploaded",
        StatusCodes.BAD_REQUEST,
      );
    }

    const result = await uploadAvatarService(request.user!.id, request.file);

    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default uploadAvatar;
