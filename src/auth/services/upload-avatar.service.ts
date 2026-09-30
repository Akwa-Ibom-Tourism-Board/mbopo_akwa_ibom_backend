import fs from "fs";
import path from "path";
import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { StatusCodes } from "../../configurations/statusCodes";
import { buildFileUrl, UPLOADS_DIR } from "../../configurations/upload";
import { User } from "../User";
import { serializeUser } from "../auth.helpers";

const ALLOWED_AVATAR_MIME_TYPES = new Set(["image/jpeg", "image/png"]);

const uploadAvatarService = errorUtilities.withServiceErrorHandling(
  async (userId: string, file: Express.Multer.File) => {
    if (!ALLOWED_AVATAR_MIME_TYPES.has(file.mimetype)) {
      fs.unlink(file.path, () => {});
      throw errorUtilities.createError(
        "Profile photo must be a JPEG or PNG image",
        StatusCodes.BAD_REQUEST,
      );
    }

    const user = await User.findByPk(userId);
    if (!user) {
      fs.unlink(file.path, () => {});
      throw errorUtilities.createError("User not found", StatusCodes.NOT_FOUND);
    }

    // Best-effort cleanup of the previous photo — never let a stale-file
    // deletion failure block the actual update.
    const previousUrl = user.get("avatarUrl") as string | null;
    if (previousUrl) {
      const previousFilename = previousUrl.split("/").pop();
      if (previousFilename) {
        fs.unlink(path.join(UPLOADS_DIR, previousFilename), () => {});
      }
    }

    const url = buildFileUrl(file.filename);
    await user.update({ avatarUrl: url });

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Profile photo updated",
      serializeUser(user),
    );
  },
);

export default uploadAvatarService;
