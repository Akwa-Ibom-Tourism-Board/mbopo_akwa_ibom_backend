import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { AdminUser, AdminRole } from "../AdminUser";
import { serializeAdminUser } from "../../helpers/admin-auth.helpers";
import { assertSingleActiveHeadJudge } from "../../helpers/admin-users.helpers";

const setAdminUserActiveService = errorUtilities.withServiceErrorHandling(
  async (actorId: string, targetId: string, active: boolean) => {
    if (!active && actorId === targetId) {
      throw errorUtilities.createError(
        "You cannot deactivate your own account",
        StatusCodes.BAD_REQUEST,
      );
    }

    const admin = await AdminUser.findByPk(targetId);
    if (!admin) {
      throw errorUtilities.createError("Admin user not found", StatusCodes.NOT_FOUND);
    }
    if ((admin.get("role") as AdminRole) === AdminRole.SuperAdmin) {
      throw errorUtilities.createError(
        "Super Admin accounts cannot be deactivated here",
        StatusCodes.FORBIDDEN,
      );
    }

    await assertSingleActiveHeadJudge(admin.get("role") as AdminRole, active, targetId);
    // Deactivating also revokes any live session immediately.
    await admin.update({ active, refreshToken: active ? admin.get("refreshToken") : null } as any);

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      active ? "Admin user reactivated" : "Admin user deactivated",
      serializeAdminUser(admin),
    );
  },
);

export default setAdminUserActiveService;
