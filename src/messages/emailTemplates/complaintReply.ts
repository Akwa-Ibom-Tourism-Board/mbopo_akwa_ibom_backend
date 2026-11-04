import { wrapEmailHtml } from "../../configurations/email";

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Bold, high-contrast, and always carries a live mailto: link, so a
// follow-up path survives even if the recipient only skims the email.
const followUpNotice = `
  <div style="margin-top: 18px; padding: 14px 16px; border: 2px solid #e77818; border-radius: 6px; background: #fff7ed;">
    <strong style="color: #003922;">Need to follow up?</strong><br>
    You can reply directly to this email or through the <strong>"Ask Me"</strong> widget on
    our website, or send a follow-up email to
    <a href="mailto:mbopo.akwaibomstate@gmail.com" style="color: #003922; font-weight: bold;">mbopo.akwaibomstate@gmail.com</a>.
  </div>
`;

export const complaintReplyTemplate = (firstName: string, body: string) => ({
  subject: "A reply to your message — Mbopo Akwa Ibom",
  htmlBody: wrapEmailHtml(
    `Hello ${escapeHtml(firstName)},<br><br>
     Thank you for reaching out to Mbopo Akwa Ibom. Here's our reply to your message:<br><br>
     <div style="padding: 14px 16px; border-left: 3px solid #003922; background: #f7f5f2;">
       ${escapeHtml(body).replace(/\n/g, "<br>")}
     </div><br>
     If you have any further questions, feel free to reply to this email.
     ${followUpNotice}`,
  ),
});
