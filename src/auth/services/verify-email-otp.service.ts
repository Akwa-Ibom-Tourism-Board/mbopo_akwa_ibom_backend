import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { StatusCodes } from "../../configurations/statusCodes";
import { User } from "../User";
import { compareHash } from "../auth.helpers";
import { createNotification } from "../../notifications/services/create.service";
import { NotificationType } from "../../notifications/Notification";

const MAX_OTP_ATTEMPTS = 5;

const verifyEmailOtpService = errorUtilities.withServiceErrorHandling(
  async (email: string, otp: string) => {
    const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });

    if (!user || !user.get("emailOtpHash")) {
      throw errorUtilities.createError(
        "No verification code found for this email, please request a new one",
        StatusCodes.BAD_REQUEST,
      );
    }

    const expiresAt = user.get("emailOtpExpiresAt") as Date | null;
    if (!expiresAt || expiresAt.getTime() < Date.now()) {
      throw errorUtilities.createError(
        "Verification code has expired. Please request a new one.",
        StatusCodes.GONE,
      );
    }

    const isValid = await compareHash(otp, user.get("emailOtpHash") as string);
    if (!isValid) {
      // Model#increment issues an atomic `UPDATE ... SET x = x + 1` and
      // refreshes the instance's in-memory value from it — never a
      // read-modify-write that could lose increments under concurrent guesses.
      await user.increment("emailOtpAttempts");
      const attempts = user.get("emailOtpAttempts") as number;

      if (attempts >= MAX_OTP_ATTEMPTS) {
        await user.update({ emailOtpHash: null, emailOtpExpiresAt: null, emailOtpAttempts: 0 });
        throw errorUtilities.createError(
          "Too many incorrect attempts. Please request a new code.",
          StatusCodes.TOO_MANY_REQUESTS,
        );
      }

      throw errorUtilities.createError("Invalid verification code", StatusCodes.UNAUTHORIZED);
    }

    await user.update({
      emailVerified: true,
      emailOtpHash: null,
      emailOtpExpiresAt: null,
      emailOtpAttempts: 0,
    });

    await createNotification({
      userId: user.get("id") as string,
      title: "Welcome to Mbopo Akwa Ibom",
      body: "Your email has been verified. You can now complete your application.",
      type: NotificationType.Account,
    });

    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Email verified successfully");
  },
);

export default verifyEmailOtpService;
