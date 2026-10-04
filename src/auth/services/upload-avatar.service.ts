import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { StatusCodes } from "../../configurations/statusCodes";
import { assertValidUploadReference } from "../../configurations/cloudinary";
import { User } from "../User";
import { serializeUser } from "../auth.helpers";

const uploadAvatarService = errorUtilities.withServiceErrorHandling(
  async (userId: string, input: { url: string; publicId: string }) => {
    assertValidUploadReference(userId, "avatar", input.url, input.publicId);

    // Cloudinary already overwrote the previous asset at this same
    // public_id, so there is nothing to clean up. A single-row UPDATE is
    // atomic; last write wins, which is the right semantics for an avatar.
    const [affectedCount] = await User.update(
      { avatarUrl: input.url, avatarPublicId: input.publicId },
      { where: { id: userId } },
    );
    if (affectedCount === 0) {
      throw errorUtilities.createError("User not found", StatusCodes.NOT_FOUND);
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
