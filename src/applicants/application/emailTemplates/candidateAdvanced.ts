import { wrapEmailHtml } from "../../../configurations/email";
import configurations from "../../../configurations";

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// `destination` is a short phrase describing where the candidate is headed
// next (e.g. "Senatorial District Selection", "the Grand Finale", "Grand
// Finale Round 3") — see describeDestination() in submit-results.service.ts,
// the only caller.
export const candidateAdvancedTemplate = (firstName: string | null, destination: string) => ({
  subject: "You've advanced! — Mbopo Akwa Ibom",
  htmlBody: wrapEmailHtml(
    `Hello${firstName ? ` ${escapeHtml(firstName)}` : ""},<br><br>
     Congratulations! The judges have reviewed the results, and you have advanced to
     <strong>${escapeHtml(destination)}</strong> in the Mbopo Akwa Ibom competition.<br><br>
     Keep an eye on your dashboard and email for what comes next.`,
    `${configurations.FRONTEND_URL}/dashboard`,
    "View my dashboard",
  ),
});
