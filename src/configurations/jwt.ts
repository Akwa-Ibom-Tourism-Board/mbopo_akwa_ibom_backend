import jwt from "jsonwebtoken";
import configurations from ".";

export type TokenType = "access" | "refresh";

export interface TokenPayload {
  id: string;
  typ?: TokenType;
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
  return jwt.sign(payload, getSecret(), { expiresIn: expiresIn as any, algorithm: "HS256" });
};

/**
 * Pins the algorithm (no "none"/alg-confusion) and — when `expectedType` is
 * given — rejects a token minted for another purpose, so a long-lived
 * refresh token can never be replayed as an access token.
 */
const verifyToken = <T extends object = TokenPayload>(
  token: string,
  expectedType?: TokenType,
): T => {
  const payload = jwt.verify(token, getSecret(), { algorithms: ["HS256"] }) as TokenPayload;
  if (expectedType && payload.typ !== expectedType) {
    throw new Error("Invalid token type");
  }
  return payload as unknown as T;
};

export default {
  signToken,
  verifyToken,
};
