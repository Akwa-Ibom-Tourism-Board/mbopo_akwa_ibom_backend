import { wrapEmailHtml } from "../../../configurations/email";
import configurations from "../../../configurations";

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const candidateWinnerTemplate = (firstName: string | null) => ({
  subject: `Congratulations — Mbopo Akwa Ibom ${new Date().getFullYear()}`,
  htmlBody: wrapEmailHtml(
    `Hello${firstName ? ` ${escapeHtml(firstName)}` : ""},<br><br>
     Congratulations! You have been crowned winner of Mbopo Akwa Ibom
     ${new Date().getFullYear()}.<br><br>
     This is the beginning of an incredible journey. Our team will be in touch shortly
     with everything you need to know next.`,
    `${configurations.FRONTEND_URL}/dashboard`,
    "View my dashboard",
  ),
});
