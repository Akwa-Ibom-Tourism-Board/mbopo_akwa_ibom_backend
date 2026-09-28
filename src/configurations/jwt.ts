import jwt from "jsonwebtoken";
import configurations from ".";

export interface TokenPayload {
  id: string;
  [key: string]: any;
}

export const TokenDuration = {
  accessTokenDuration: "3h",
  refreshTokenDuration: "30d",
};

const getSecret = (): string => {
  if (!configurations.APP_SECRET) {
    throw new Error("APP_SECRET is not configured");
  }
  return configurations.APP_SECRET;
};

const signToken = (
  payload: TokenPayload,
  expiresIn: string | number = TokenDuration.accessTokenDuration,
): string => {
  return jwt.sign(payload, getSecret(), { expiresIn: expiresIn as any });
};

const verifyToken = <T extends object = TokenPayload>(token: string): T => {
  return jwt.verify(token, getSecret()) as T;
};

export default {
  signToken,
  verifyToken,
};
