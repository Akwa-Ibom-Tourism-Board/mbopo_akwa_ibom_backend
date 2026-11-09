import { wrapEmailHtml } from "../../configurations/email";

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Same follow-up notice as complaintReply.ts's template, duplicated rather
// than imported — these two templates are similar in shape but distinct in
// intent (a reply to something they said vs. staff reaching out first), and
// keeping them independent means editing one's wording can't silently
// change the other's.
const followUpNotice = `
  <div style="margin-top: 18px; padding: 14px 16px; border: 2px solid #e77818; border-radius: 6px; background: #fff7ed;">
    <strong style="color: #003922;">Need to follow up?</strong><br>
    You can reply directly to this email or through the <strong>"Ask Me"</strong> widget on
    our website, or send a follow-up email to
    <a href="mailto:mbopo.akwaibomstate@gmail.com" style="color: #003922; font-weight: bold;">mbopo.akwaibomstate@gmail.com</a>.
  </div>
`;

export const adminMessageTemplate = (firstName: string, subject: string, body: string) => ({
  subject: `${subject} — Mbopo Akwa Ibom`,
  htmlBody: wrapEmailHtml(
    `Hello ${escapeHtml(firstName)},<br><br>
     You have a message from the Mbopo Akwa Ibom team:<br><br>
     <div style="padding: 14px 16px; border-left: 3px solid #003922; background: #f7f5f2;">
       ${escapeHtml(body).replace(/\n/g, "<br>")}
     </div><br>
     If you have any questions, feel free to reply to this email.
     ${followUpNotice}`,
  ),
});
