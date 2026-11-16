import { Request, Response, NextFunction } from "express";
import jwtUtilities, { TokenDuration, TokenPayload } from "./jwt";
import { User } from "../auth/User";
import { hashToken } from "../auth/auth.helpers";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

const authenticate = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const authorizationHeader = request.headers.authorization;
    const refreshToken = request.headers["x-refresh-token"] as
      | string
      | undefined;

    if (!authorizationHeader) {
      return response.status(401).json({
        status: "error",
        message: "Please login again",
      });
    }

    const authorizationToken = authorizationHeader.split(" ")[1];
    if (!authorizationToken) {
      return response.status(401).json({
        status: "error",
        message: "Login required",
      });
    }

    let verifiedUser: TokenPayload;
    try {
      verifiedUser = jwtUtilities.verifyToken(authorizationToken, "access");
    } catch (error: any) {
      if (error.message !== "jwt expired") {
        return response.status(401).json({
          status: "error",
          message: "Login Again, Invalid Token",
        });
      }

      if (!refreshToken) {
        return response.status(401).json({
          status: "error",
          message: "Refresh Token not found. Please login again.",
        });
      }

      let refreshVerifiedUser: TokenPayload;
      try {
        refreshVerifiedUser = jwtUtilities.verifyToken(refreshToken, "refresh");
      } catch {
        return response.status(401).json({
          status: "error",
          message: "Refresh Token Expired. Please login again.",
        });
      }

      const user = await User.findByPk(refreshVerifiedUser.id);

      const storedRefreshToken = user?.get("refreshToken") as
        | string
        | undefined;

      const incomingRefreshTokenHash = hashToken(refreshToken);

      const tokenMatches =
        !!storedRefreshToken && storedRefreshToken === incomingRefreshTokenHash;

      if (!user || !tokenMatches) {
        return response.status(401).json({
          status: "error",
          message: "Please login again.",
        });
      }

      // Deliberately not checked on the common (non-refresh) path above —
      // that path stays DB-free by design (see login.service.ts's
      // issueSession comment). A disabled applicant's current access token
      // still works until it naturally expires or they need to refresh;
      // this is where disabling actually takes effect.
      if (!user.get("active")) {
        return response.status(403).json({
          status: "error",
          message: "This account has been disabled. Please contact support.",
        });
      }

      const tokenPayload: TokenPayload = { id: refreshVerifiedUser.id };

      const newAccessToken = jwtUtilities.signToken(
        { id: tokenPayload.id, typ: "access" },
        TokenDuration.accessTokenDuration,
      );

      response.setHeader("x-access-token", newAccessToken);

      request.user = tokenPayload;
      return next();
    }

    request.user = verifiedUser;
    return next();
  } catch (error: any) {
    console.error("Authentication error:", error.message);
    return response.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};

export default authenticate;
