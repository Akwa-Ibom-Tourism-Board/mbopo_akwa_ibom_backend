import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { AdminUser, AdminRole } from "../AdminUser";
import { serializeAdminUser } from "../../helpers/admin-auth.helpers";
import {
  type AdminUserUpdate,
  assertAssignable,
  assertSingleActiveHeadJudge,
  assertTargetVisible,
  mapUniqueConstraintError,
} from "../../helpers/admin-users.helpers";
import { recordActivity } from "../../helpers/activity.helpers";

const updateAdminUserService = errorUtilities.withServiceErrorHandling(
  async (actorRole: AdminRole, actorId: string, targetId: string, patch: AdminUserUpdate) => {
    const admin = await AdminUser.findByPk(targetId);
    if (!admin) {
      throw errorUtilities.createError("Admin user not found", StatusCodes.NOT_FOUND);
    }
    assertTargetVisible(admin, actorRole, "edited");

    if (patch.role) {
      assertAssignable(actorRole, patch.role);
      await assertSingleActiveHeadJudge(patch.role, true, targetId);
    }

    try {
      await admin.update(patch as any);
    } catch (error) {
      mapUniqueConstraintError(error);
    }

    await recordActivity(
      actorId,
      "users",
      `Updated the account of ${admin.get("firstName")} ${admin.get("lastName")}`,
    );

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Admin user updated",
      serializeAdminUser(admin),
    );
  },
);

export default updateAdminUserService;
