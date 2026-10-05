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
    const refreshToken = request.headers["x-refresh-token"] as string | undefined;

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

      if (!user || user.get("refreshToken") !== hashToken(refreshToken)) {
        return response.status(401).json({
          status: "error",
          message: "Please login again.",
        });
      }

      const tokenPayload: TokenPayload = { id: refreshVerifiedUser.id };

      const newAccessToken = jwtUtilities.signToken(
        { id: tokenPayload.id, typ: "access" },
        TokenDuration.accessTokenDuration,
      );
      const newRefreshToken = jwtUtilities.signToken(
        { id: tokenPayload.id, typ: "refresh" },
        TokenDuration.refreshTokenDuration,
      );

      response.setHeader("x-access-token", newAccessToken);
      response.setHeader("x-refresh-token", newRefreshToken);

      await user.update({ refreshToken: hashToken(newRefreshToken) });

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
