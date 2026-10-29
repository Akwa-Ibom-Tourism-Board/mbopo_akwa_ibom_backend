import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { AdminUser } from "../../users/AdminUser";
import { compareHash, hashData } from "../../../auth/auth.helpers";

const adminChangePasswordService = errorUtilities.withServiceErrorHandling(
  async (adminId: string, currentPassword: string, newPassword: string) => {
    const admin = await AdminUser.findByPk(adminId);
    if (!admin) {
      throw errorUtilities.createError("Admin account not found", StatusCodes.NOT_FOUND);
    }

    const isValid = await compareHash(currentPassword, admin.get("passwordHash") as string);
    if (!isValid) {
      throw errorUtilities.createError("Current password is incorrect", StatusCodes.BAD_REQUEST);
    }

    // Revoke the refresh token so other sessions must log in again.
    await admin.update({
      passwordHash: await hashData(newPassword),
      passwordChangedAt: new Date(),
      refreshToken: null,
    });

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Password changed successfully",
    );
  },
);

export default adminChangePasswordService;
