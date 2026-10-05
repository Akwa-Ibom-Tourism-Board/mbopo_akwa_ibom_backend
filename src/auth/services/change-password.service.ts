import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { StatusCodes } from "../../configurations/statusCodes";
import { User } from "../User";
import { compareHash, hashData } from "../auth.helpers";

const changePasswordService = errorUtilities.withServiceErrorHandling(
  async (userId: string, currentPassword: string, newPassword: string) => {
    const user = await User.findByPk(userId);

    if (!user) {
      throw errorUtilities.createError("User not found", StatusCodes.NOT_FOUND);
    }

    const isValid = await compareHash(currentPassword, user.get("password") as string);
    if (!isValid) {
      throw errorUtilities.createError("Current password is incorrect", StatusCodes.BAD_REQUEST);
    }

    // Revoke the refresh token so other sessions must log in again.
    await user.update({ password: await hashData(newPassword), refreshToken: null });

    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Password changed successfully");
  },
);

export default changePasswordService;
