import { wrapEmailHtml } from "../../../configurations/email";
import configurations from "../../../configurations";

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const applicationSubmittedTemplate = (firstName: string | null, referenceCode: string) => ({
  subject: "Application received — Mbopo Akwa Ibom",
  htmlBody: wrapEmailHtml(
    `Hello${firstName ? ` ${escapeHtml(firstName)}` : ""},<br><br>
     Your Mbopo Akwa Ibom application was submitted successfully.<br><br>
     Your reference code is:<br><br>
     <strong style="font-size: 24px; letter-spacing: 2px;">${escapeHtml(referenceCode)}</strong><br><br>
     Please keep this code for any enquiries. We will notify you of the outcome by email and on your dashboard.`,
    `${configurations.FRONTEND_URL}/dashboard`,
    "View my application",
  ),
});
