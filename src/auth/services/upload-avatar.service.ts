import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { StatusCodes } from "../../configurations/statusCodes";
import { assertValidUploadReference } from "../../configurations/cloudinary";
import { User } from "../User";
import { serializeUser } from "../auth.helpers";

const AVATAR_LOCKED_ERROR =
  "Your profile photo is set from your verified NIN and can't be changed";

const uploadAvatarService = errorUtilities.withServiceErrorHandling(
  async (userId: string, input: { url: string; publicId: string }) => {
    assertValidUploadReference(userId, "avatar", input.url, input.publicId);

    const existing = await User.findByPk(userId, { attributes: ["id", "identityVerified"] });
    if (!existing) {
      throw errorUtilities.createError("User not found", StatusCodes.NOT_FOUND);
    }
    // After NIN verification the avatar is the NIN-sourced photo, locked.
    if (existing.get("identityVerified")) {
      throw errorUtilities.createError(AVATAR_LOCKED_ERROR, StatusCodes.FORBIDDEN);
    }

    // Conditional update: if the user verifies between the check above and
    // this write, the NIN photo must not be replaced by a self-upload.
    const [affectedCount] = await User.update(
      { avatarUrl: input.url, avatarPublicId: input.publicId },
      { where: { id: userId, identityVerified: false } },
    );
    if (affectedCount === 0) {
      throw errorUtilities.createError(AVATAR_LOCKED_ERROR, StatusCodes.FORBIDDEN);
    }

    const user = await User.findByPk(userId);

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Profile photo updated",
      serializeUser(user!),
    );
  },
);

export default uploadAvatarService;
