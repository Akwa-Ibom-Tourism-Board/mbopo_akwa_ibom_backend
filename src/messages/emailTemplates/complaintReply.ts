import { wrapEmailHtml } from "../../configurations/email";

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const complaintReplyTemplate = (firstName: string, body: string) => ({
  subject: "A reply to your message — Mbopo Akwa Ibom",
  htmlBody: wrapEmailHtml(
    `Hello ${escapeHtml(firstName)},<br><br>
     Thank you for reaching out to Mbopo Akwa Ibom. Here's our reply to your message:<br><br>
     <div style="padding: 14px 16px; border-left: 3px solid #003922; background: #f7f5f2;">
       ${escapeHtml(body).replace(/\n/g, "<br>")}
     </div><br>
     If you have any further questions, feel free to reach out again.`,
  ),
});
