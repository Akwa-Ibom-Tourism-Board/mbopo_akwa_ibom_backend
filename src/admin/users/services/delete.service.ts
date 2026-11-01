import { ForeignKeyConstraintError } from "sequelize";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { database } from "../../../configurations/database";
import { AdminUser, AdminRole } from "../AdminUser";
import { ActivityLog } from "../../activity/ActivityLog";
import { PhaseState } from "../../stages/PhaseState";
import { assertTargetVisible } from "../../helpers/admin-users.helpers";
import { recordActivity } from "../../helpers/activity.helpers";

// Gated at the route via "users.delete" — Super Admin only, unlike every
// other action here (shared with Admin via "users.manage"). Deleting is the
// one staff action with no undo, so it gets the highest bar.
const deleteAdminUserService = errorUtilities.withServiceErrorHandling(
  async (actorId: string, actorRole: AdminRole, targetId: string) => {
    if (actorId === targetId) {
      throw errorUtilities.createError(
        "You cannot delete your own account",
        StatusCodes.BAD_REQUEST,
      );
    }

    const admin = await AdminUser.findByPk(targetId);
    if (!admin) {
      throw errorUtilities.createError("Admin user not found", StatusCodes.NOT_FOUND);
    }
    assertTargetVisible(admin, actorRole, "deleted");

    const name = `${admin.get("firstName")} ${admin.get("lastName")}`;

    try {
      await database.transaction(async (transaction) => {
        // Attribution-only references are cleared, not preserved — losing
        // "who opened this stage" to "unknown" is fine. Judge scores and
        // complaint replies are real work product, not attribution, so
        // those FKs stay NOT NULL and are deliberately left to block the
        // delete below instead (see the catch).
        await ActivityLog.update({ actorId: null } as any, { where: { actorId: targetId }, transaction });
        await PhaseState.update({ openedBy: null } as any, { where: { openedBy: targetId }, transaction });
        await PhaseState.update({ closedBy: null } as any, { where: { closedBy: targetId }, transaction });
        await PhaseState.update(
          { resultsSubmittedBy: null } as any,
          { where: { resultsSubmittedBy: targetId }, transaction },
        );
        await PhaseState.update({ reopenedBy: null } as any, { where: { reopenedBy: targetId }, transaction });

        await admin.destroy({ transaction });
      });
    } catch (error) {
      if (error instanceof ForeignKeyConstraintError) {
        throw errorUtilities.createError(
          "This account can't be deleted — it has judging scores or complaint replies on record. Deactivate it instead.",
          StatusCodes.CONFLICT,
        );
      }
      throw error;
    }

    await recordActivity(actorId, "users", `Deleted the account of ${name}`);

    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Admin user deleted");
  },
);

export default deleteAdminUserService;
