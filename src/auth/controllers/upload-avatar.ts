import { Request, Response } from "express";
import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import uploadAvatarService from "../services/upload-avatar.service";

const uploadAvatar = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const { url, publicId } = request.body;
    const result = await uploadAvatarService(request.user!.id, { url, publicId });

    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default uploadAvatar;
