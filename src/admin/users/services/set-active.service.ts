import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { AdminUser, AdminRole } from "../AdminUser";
import { serializeAdminUser } from "../../helpers/admin-auth.helpers";
import { assertSingleActiveHeadJudge, assertTargetVisible } from "../../helpers/admin-users.helpers";
import { recordActivity } from "../../helpers/activity.helpers";

const setAdminUserActiveService = errorUtilities.withServiceErrorHandling(
  async (actorId: string, actorRole: AdminRole, targetId: string, active: boolean) => {
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
    assertTargetVisible(admin, actorRole, "deactivated");

    await assertSingleActiveHeadJudge(admin.get("role") as AdminRole, active, targetId);
    // Deactivating also revokes any live session immediately.
    await admin.update({ active, refreshToken: active ? admin.get("refreshToken") : null } as any);

    await recordActivity(
      actorId,
      "users",
      `${active ? "Reactivated" : "Deactivated"} the account of ${admin.get("firstName")} ${admin.get("lastName")}`,
    );

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      active ? "Admin user reactivated" : "Admin user deactivated",
      serializeAdminUser(admin),
    );
  },
);

export default setAdminUserActiveService;
