import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { hashData } from "../../../auth/auth.helpers";
import { AdminUser } from "../AdminUser";
import { generateTemporaryPassword } from "../../helpers/admin-users.helpers";
import { recordActivity } from "../../helpers/activity.helpers";

const resetAdminUserPasswordService = errorUtilities.withServiceErrorHandling(
  async (actorId: string, targetId: string) => {
    const admin = await AdminUser.findByPk(targetId);
    if (!admin) {
      throw errorUtilities.createError("Admin user not found", StatusCodes.NOT_FOUND);
    }

    const temporaryPassword = generateTemporaryPassword();
    await admin.update({
      passwordHash: await hashData(temporaryPassword),
      passwordChangedAt: new Date(),
      refreshToken: null,
    } as any);

    await recordActivity(
      actorId,
      "users",
      `Reset the password of ${admin.get("firstName")} ${admin.get("lastName")}`,
    );

    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Password reset", {
      email: admin.get("email"),
      temporaryPassword,
    });
  },
);

export default resetAdminUserPasswordService;
