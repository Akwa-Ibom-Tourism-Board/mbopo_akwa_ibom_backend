import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { StatusCodes } from "../../configurations/statusCodes";
import { queueEmail } from "../../configurations/email-queue";
import { User } from "../User";
import { generateNumericOtp, hashData, compareHash } from "../auth.helpers";
import { loginOtpTemplate } from "../emailTemplates/loginOtp";
import { issueSession } from "./login.service";

const EMAIL_OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

export const loginRequestOtpService = errorUtilities.withServiceErrorHandling(
  async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ where: { email: normalizedEmail } });

    if (user) {
      const otp = generateNumericOtp();

      await user.update({
        emailOtpHash: await hashData(otp),
        emailOtpExpiresAt: new Date(Date.now() + EMAIL_OTP_TTL_MS),
        emailOtpAttempts: 0,
      });

      const template = loginOtpTemplate(otp);
      await queueEmail({ to: normalizedEmail, subject: template.subject, htmlBody: template.htmlBody });
    }

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "If an account with this email exists, a login code has been sent",
    );
  },
);

export const loginVerifyOtpService = errorUtilities.withServiceErrorHandling(
  async (email: string, otp: string) => {
    const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });

    if (!user || !user.get("emailOtpHash")) {
      throw errorUtilities.createError(
        "No login code found for this email, please request a new one",
        StatusCodes.BAD_REQUEST,
      );
    }

    const expiresAt = user.get("emailOtpExpiresAt") as Date | null;
    if (!expiresAt || expiresAt.getTime() < Date.now()) {
      throw errorUtilities.createError(
        "Login code has expired. Please request a new one.",
        StatusCodes.GONE,
      );
    }

    const isValid = await compareHash(otp, user.get("emailOtpHash") as string);
    if (!isValid) {
      await user.increment("emailOtpAttempts");
      const attempts = user.get("emailOtpAttempts") as number;

      if (attempts >= MAX_OTP_ATTEMPTS) {
        await user.update({ emailOtpHash: null, emailOtpExpiresAt: null, emailOtpAttempts: 0 });
        throw errorUtilities.createError(
          "Too many incorrect attempts. Please request a new code.",
          StatusCodes.TOO_MANY_REQUESTS,
        );
      }

      throw errorUtilities.createError("Invalid login code", StatusCodes.UNAUTHORIZED);
    }

    await user.update({
      emailOtpHash: null,
      emailOtpExpiresAt: null,
      emailOtpAttempts: 0,
      emailVerified: true,
    });

    const session = await issueSession(user);

    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Login successful", session);
  },
);
