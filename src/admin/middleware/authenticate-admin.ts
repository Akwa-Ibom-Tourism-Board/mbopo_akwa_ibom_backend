import { Request, Response, NextFunction } from "express";
import jwtUtilities, { TokenDuration, TokenPayload } from "../../configurations/jwt";
import { hashToken } from "../../auth/auth.helpers";
import { AdminUser, AdminRole } from "../users/AdminUser";

export interface AdminTokenPayload extends TokenPayload {
  role: AdminRole;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      adminUser?: AdminTokenPayload;
    }
  }
}

/**
 * The admin-portal equivalent of configurations/authenticate.ts — same
 * silent-refresh shape, but verifies the "admin_access"/"admin_refresh"
 * token pair instead, and (unlike the applicant flow) re-checks `active`
 * on every request: a deactivated staff member's existing token must stop
 * working immediately, not just at its natural 3h expiry.
 */
const authenticateAdmin = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const authorizationHeader = request.headers.authorization;
    const refreshToken = request.headers["x-refresh-token"] as string | undefined;

    if (!authorizationHeader) {
      return response.status(401).json({ status: "error", message: "Please login again" });
    }

    const authorizationToken = authorizationHeader.split(" ")[1];
    if (!authorizationToken) {
      return response.status(401).json({ status: "error", message: "Login required" });
    }

    let verified: AdminTokenPayload;
    try {
      verified = jwtUtilities.verifyToken<AdminTokenPayload>(authorizationToken, "admin_access");
    } catch (error: any) {
      if (error.message !== "jwt expired") {
        return response
          .status(401)
          .json({ status: "error", message: "Login Again, Invalid Token" });
      }

      if (!refreshToken) {
        return response
          .status(401)
          .json({ status: "error", message: "Refresh Token not found. Please login again." });
      }

      let refreshVerified: AdminTokenPayload;
      try {
        refreshVerified = jwtUtilities.verifyToken<AdminTokenPayload>(
          refreshToken,
          "admin_refresh",
        );
      } catch {
        return response
          .status(401)
          .json({ status: "error", message: "Refresh Token Expired. Please login again." });
      }

      const admin = await AdminUser.findByPk(refreshVerified.id);
      if (!admin || admin.get("refreshToken") !== hashToken(refreshToken)) {
        return response.status(401).json({ status: "error", message: "Please login again." });
      }
      if (!admin.get("active")) {
        return response
          .status(403)
          .json({ status: "error", message: "This account has been deactivated." });
      }

      const role = admin.get("role") as AdminRole;
      const newAccessToken = jwtUtilities.signToken(
        { id: refreshVerified.id, role, typ: "admin_access" },
        TokenDuration.accessTokenDuration,
      );
      const newRefreshToken = jwtUtilities.signToken(
        { id: refreshVerified.id, role, typ: "admin_refresh" },
        TokenDuration.refreshTokenDuration,
      );

      response.setHeader("x-access-token", newAccessToken);
      response.setHeader("x-refresh-token", newRefreshToken);
      await admin.update({ refreshToken: hashToken(newRefreshToken) });

      request.adminUser = { id: refreshVerified.id, role };
      return next();
    }

    // Re-checked even on the common (non-refresh) path — see doc comment.
    const admin = await AdminUser.findByPk(verified.id);
    if (!admin || !admin.get("active")) {
      return response
        .status(403)
        .json({ status: "error", message: "This account has been deactivated." });
    }

    request.adminUser = verified;
    return next();
  } catch (error: any) {
    console.error("Admin authentication error:", error.message);
    return response.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};

export default authenticateAdmin;
