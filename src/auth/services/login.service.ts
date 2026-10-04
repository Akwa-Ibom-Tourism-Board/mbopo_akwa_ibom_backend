import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { StatusCodes } from "../../configurations/statusCodes";
import jwtUtilities, { TokenDuration } from "../../configurations/jwt";
import { User } from "../User";
import { compareHash, serializeUser } from "../auth.helpers";

// Kept minimal — just `{ id }` — so `authenticate` never needs a DB read to
// know who's asking, only when a refresh actually happens. See BUILD_ME.md §11.
const issueSession = async (user: User) => {
  const tokenPayload = { id: user.get("id") as string };

  const token = jwtUtilities.signToken(tokenPayload, TokenDuration.accessTokenDuration);
  const refreshToken = jwtUtilities.signToken(tokenPayload, TokenDuration.refreshTokenDuration);

  await user.update({ refreshToken });

  // Must be returned here, not just persisted on the row — authenticate.ts
  // can only read a refresh token back from a request header, and the
  // client can never populate that header with a value it was never given.
  return { token, refreshToken, user: serializeUser(user) };
};

const loginService = errorUtilities.withServiceErrorHandling(
  async (email: string, password: string) => {
    const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });

    if (!user) {
      throw errorUtilities.createError("Invalid email or password", StatusCodes.BAD_REQUEST);
    }

    const isValid = await compareHash(password, user.get("password") as string);
    if (!isValid) {
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
