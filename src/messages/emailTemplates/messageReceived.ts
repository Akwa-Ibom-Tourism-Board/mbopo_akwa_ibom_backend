import { wrapEmailHtml } from "../../configurations/email";

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const messageReceivedTemplate = (name: string) => ({
  subject: "We've received your message — Mbopo Akwa Ibom",
  htmlBody: wrapEmailHtml(
    `Hello ${escapeHtml(name)},<br><br>
     Thank you for reaching out to Mbopo Akwa Ibom. Your message has been
     received and noted — a response will be sent to this email soon.`,
  ),
});
