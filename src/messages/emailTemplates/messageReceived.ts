import { wrapEmailHtml } from "../../configurations/email";

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Shared by this template and complaintReply's — bold, high-contrast, and
// always carries a live mailto: link, so a follow-up path survives even if
// the recipient only skims the email.
const followUpNotice = `
  <div style="margin-top: 18px; padding: 14px 16px; border: 2px solid #e77818; border-radius: 6px; background: #fff7ed;">
    <strong style="color: #003922;">Need to follow up?</strong><br>
    You can reply directly through the <strong>"Ask Me"</strong> widget on
    our website, or send a follow-up email to
    <a href="mailto:mbopo.akwaibomstate@gmail.com" style="color: #003922; font-weight: bold;">mbopo.akwaibomstate@gmail.com</a>.
  </div>
`;

export const messageReceivedTemplate = (name: string) => ({
  subject: "We've received your message — Mbopo Akwa Ibom",
  htmlBody: wrapEmailHtml(
    `Hello ${escapeHtml(name)},<br><br>
     Thank you for reaching out to Mbopo Akwa Ibom. Your message has been
     received and noted — a response will be sent to this email soon.
     ${followUpNotice}`,
  ),
});
