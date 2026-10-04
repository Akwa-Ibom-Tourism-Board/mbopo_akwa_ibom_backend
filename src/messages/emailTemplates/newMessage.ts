import { wrapEmailHtml } from "../../configurations/email";

// Everything here is attacker-controlled (public form) and ends up in HTML.
const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const newMessageTemplate = (input: {
  name: string;
  email: string;
  phoneNumber: string;
  title?: string | null;
  message: string;
}) => ({
  subject: `New contact message${input.title ? `: ${input.title.replace(/[\r\n]+/g, " ")}` : ""}`,
  htmlBody: wrapEmailHtml(
    `A new message was submitted through the contact form.<br><br>
     <strong>Name:</strong> ${escapeHtml(input.name)}<br>
     <strong>Email:</strong> ${escapeHtml(input.email)}<br>
     <strong>Phone:</strong> ${escapeHtml(input.phoneNumber)}<br>
     ${input.title ? `<strong>Title:</strong> ${escapeHtml(input.title)}<br>` : ""}
     <br>${escapeHtml(input.message).replace(/\n/g, "<br>")}`,
  ),
});
