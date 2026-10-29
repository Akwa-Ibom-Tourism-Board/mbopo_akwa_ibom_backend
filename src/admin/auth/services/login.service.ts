import bcrypt from "bcryptjs";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { AdminUser } from "../../users/AdminUser";
import { compareHash } from "../../../auth/auth.helpers";
import { issueAdminSession } from "../../helpers/admin-auth.helpers";

// Same timing-safe-miss trick as auth/services/login.service.ts: a wrong
// email costs the same bcrypt time as a wrong password, so response timing
// can't reveal which staff emails exist.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("unused-placeholder-password", 10);

const adminLoginService = errorUtilities.withServiceErrorHandling(
  async (email: string, password: string) => {
    const admin = await AdminUser.findOne({
      where: { email: email.trim().toLowerCase() },
    });

    const isValid = await compareHash(
      password,
      admin ? (admin.get("passwordHash") as string) : DUMMY_PASSWORD_HASH,
    );
    if (!admin || !isValid) {
      throw errorUtilities.createError(
        "Invalid email or password",
        StatusCodes.BAD_REQUEST,
      );
    }

    if (!admin.get("active")) {
      throw errorUtilities.createError(
        "This account has been deactivated",
        StatusCodes.FORBIDDEN,
      );
    }

    const session = await issueAdminSession(admin);

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Login successful",
      session,
    );
  },
);

export default adminLoginService;
