import { wrapEmailHtml } from "../../configurations/email";
import configurations from "../../configurations";

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const formatRole = (role: string): string =>
  role.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

export const adminAccountCreatedTemplate = (
  firstName: string | null,
  email: string,
  role: string,
  temporaryPassword: string,
) => ({
  subject: "Your staff account — Mbopo Akwa Ibom",
  htmlBody: wrapEmailHtml(
    `Hello${firstName ? ` ${escapeHtml(firstName)}` : ""},<br><br>
     An account has been created for you on the Mbopo Akwa Ibom admin platform.<br><br>
     Use these details to sign in:<br><br>
     <strong>Email:</strong> ${escapeHtml(email)}<br>
     <strong>Temporary password:</strong>
     <span style="font-family: monospace; font-size: 18px; letter-spacing: 1px;">${escapeHtml(temporaryPassword)}</span><br><br>
     Please change your password in the settings tab after your first sign-in and do not share it with anyone.`,
    `${configurations.ADMIN_FRONTEND_URL}/login`,
    "Sign in",
  ),
});
