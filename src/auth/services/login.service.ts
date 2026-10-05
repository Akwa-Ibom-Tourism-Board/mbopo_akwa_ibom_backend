import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { StatusCodes } from "../../configurations/statusCodes";
import jwtUtilities, { TokenDuration } from "../../configurations/jwt";
import bcrypt from "bcryptjs";
import { User } from "../User";
import { compareHash, hashToken, serializeUser } from "../auth.helpers";

// Compared against when the email is unknown, so a miss costs the same
// bcrypt time as a hit and response timing can't reveal which emails exist.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("unused-placeholder-password", 10);

// Kept minimal — just `{ id }` — so `authenticate` never needs a DB read to
// know who's asking, only when a refresh actually happens. See BUILD_ME.md §11.
const issueSession = async (user: User) => {
  const id = user.get("id") as string;

  const token = jwtUtilities.signToken({ id, typ: "access" }, TokenDuration.accessTokenDuration);
  const refreshToken = jwtUtilities.signToken({ id, typ: "refresh" }, TokenDuration.refreshTokenDuration);

  // Only a hash is stored: a leaked database dump can't be replayed as
  // live sessions.
  await user.update({ refreshToken: hashToken(refreshToken) });

  // Must be returned here, not just persisted on the row — authenticate.ts
  // can only read a refresh token back from a request header, and the
  // client can never populate that header with a value it was never given.
  return { token, refreshToken, user: serializeUser(user) };
};

const loginService = errorUtilities.withServiceErrorHandling(
  async (email: string, password: string) => {
    const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });

    const isValid = await compareHash(
      password,
      user ? (user.get("password") as string) : DUMMY_PASSWORD_HASH,
    );
    if (!user || !isValid) {
      throw errorUtilities.createError("Invalid email or password", StatusCodes.BAD_REQUEST);
    }

    if (!user.get("emailVerified")) {
      throw errorUtilities.createError(
        "Please verify your email before logging in",
        StatusCodes.FORBIDDEN,
      );
    }

    const session = await issueSession(user);

    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Login successful", session);
  },
);

export default loginService;
export { issueSession };
