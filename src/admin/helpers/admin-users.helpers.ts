import crypto from "crypto";
import { UniqueConstraintError } from "sequelize";
import errorUtilities from "../../configurations/error-handler";
import { StatusCodes } from "../../configurations/statusCodes";
import { AdminUser, AdminRole } from "../users/AdminUser";
import { canAssignRole } from "../rbac";

export interface NewAdminUserInput {
  firstName: string;
  lastName: string;
  email: string;
  role: AdminRole;
}

export interface AdminUserUpdate {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: AdminRole;
}

// Readable (no ambiguous 0/O/1/l), typeable over the phone — this is handed
// to the creating admin to pass along, not auto-emailed anywhere yet.
const TEMP_PASSWORD_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
export const generateTemporaryPassword = (length = 12): string => {
  return Array.from(crypto.randomFillSync(new Uint8Array(length)))
    .map((byte) => TEMP_PASSWORD_ALPHABET[byte % TEMP_PASSWORD_ALPHABET.length])
    .join("");
};

export const assertAssignable = (actorRole: AdminRole, targetRole: AdminRole) => {
  // Covers the "super_admin is never assignable through any API" rule too
  // — it's never a value in ASSIGNABLE_ROLES, for either actor.
  if (!canAssignRole(actorRole, targetRole)) {
    throw errorUtilities.createError(
      "You are not permitted to assign this role",
      StatusCodes.FORBIDDEN,
    );
  }
};

export const assertSingleActiveHeadJudge = async (
  role: AdminRole,
  active: boolean,
  excludeId?: string,
) => {
  if (role !== AdminRole.HeadJudge || !active) return;

  const existing = await AdminUser.findOne({
    where: { role: AdminRole.HeadJudge, active: true },
  });
  if (existing && existing.get("id") !== excludeId) {
    throw errorUtilities.createError(
      "There is already an active Head Judge — deactivate them first",
      StatusCodes.CONFLICT,
    );
  }
};

export const mapUniqueConstraintError = (error: unknown): never => {
  if (error instanceof UniqueConstraintError) {
    throw errorUtilities.createError("Email already in use", StatusCodes.CONFLICT);
  }
  throw error;
};
