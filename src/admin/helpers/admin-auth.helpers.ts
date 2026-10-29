import jwtUtilities, { TokenDuration } from "../../configurations/jwt";
import { hashToken } from "../../auth/auth.helpers";
import { AdminUser, AdminRole } from "../users/AdminUser";

export const serializeAdminUser = (admin: AdminUser) => {
  const json: any = admin.toJSON();
  return {
    id: json.id,
    firstName: json.firstName,
    lastName: json.lastName,
    email: json.email,
    role: json.role as AdminRole,
    active: json.active,
    createdAt: json.createdAt,
    passwordChangedAt: json.passwordChangedAt ?? null,
  };
};

/**
 * Same shape/rationale as auth/services/login.service.ts's issueSession —
 * kept minimal ({id, role}) so authenticateAdmin never needs a DB read to
 * know who's asking on the common path.
 */
export const issueAdminSession = async (admin: AdminUser) => {
  const id = admin.get("id") as string;
  const role = admin.get("role") as AdminRole;

  const token = jwtUtilities.signToken(
    { id, role, typ: "admin_access" },
    TokenDuration.accessTokenDuration,
  );
  const refreshToken = jwtUtilities.signToken(
    { id, role, typ: "admin_refresh" },
    TokenDuration.refreshTokenDuration,
  );

  await admin.update({ refreshToken: hashToken(refreshToken) });

  return { token, refreshToken, admin: serializeAdminUser(admin) };
};
