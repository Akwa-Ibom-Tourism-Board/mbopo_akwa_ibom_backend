import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { StatusCodes } from "../../configurations/statusCodes";
import { queueEmail } from "../../configurations/email-queue";
import { User } from "../User";
import { generateUrlToken, hashData, hashToken } from "../auth.helpers";
import { passwordResetRequestedTemplate } from "../emailTemplates/passwordResetRequested";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export const forgotPasswordService = errorUtilities.withServiceErrorHandling(
  async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ where: { email: normalizedEmail } });

    if (user) {
      const token = generateUrlToken();

      await user.update({
        passwordResetTokenHash: hashToken(token),
        passwordResetExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      });

      const template = passwordResetRequestedTemplate(token);
      await queueEmail({ to: normalizedEmail, subject: template.subject, htmlBody: template.htmlBody });
    }

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "If an account with this email exists, a password reset link has been sent",
    );
  },
);

export const resetPasswordService = errorUtilities.withServiceErrorHandling(
  async (token: string, password: string) => {
    const user = await User.findOne({ where: { passwordResetTokenHash: hashToken(token) } });

    if (!user) {
      throw errorUtilities.createError("Invalid or expired reset token", StatusCodes.BAD_REQUEST);
    }

    const expiresAt = user.get("passwordResetExpiresAt") as Date | null;
    if (!expiresAt || expiresAt.getTime() < Date.now()) {
      throw errorUtilities.createError("Reset token has expired", StatusCodes.GONE);
    }

    await user.update({
      password: await hashData(password),
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    });

    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Password reset successfully");
  },
);
