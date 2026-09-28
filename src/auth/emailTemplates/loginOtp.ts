import { wrapEmailHtml } from "../../configurations/email";

export const loginOtpTemplate = (otp: string) => ({
  subject: "Your login code — Mbopo Akwa Ibom",
  htmlBody: wrapEmailHtml(
    `Use the code below to log in to your Mbopo Akwa Ibom account.<br><br>
     <strong style="font-size: 28px; letter-spacing: 4px;">${otp}</strong><br><br>
     This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.`,
  ),
});
