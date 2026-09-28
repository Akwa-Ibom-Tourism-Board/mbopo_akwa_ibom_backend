import { wrapEmailHtml } from "../../configurations/email";
import configurations from "../../configurations";

export const passwordResetRequestedTemplate = (token: string) => {
  const resetLink = `${configurations.FRONTEND_URL}/reset-password?token=${token}`;

  return {
    subject: "Reset your password — Mbopo Akwa Ibom",
    htmlBody: wrapEmailHtml(
      `We received a request to reset your Mbopo Akwa Ibom account password.<br><br>
       This link expires in 1 hour. If you didn't request this, you can safely ignore this email.`,
      resetLink,
      "Reset Password",
    ),
  };
};
