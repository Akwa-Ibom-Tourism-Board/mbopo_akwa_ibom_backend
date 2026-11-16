import { adminAccountCreatedTemplate } from "../emailTemplates/staffAccountCreated";
import { queueEmail } from "../../configurations/email-queue";
interface WelcomeEmailInput {
  firstName: string | null;
  email: string;
  role: string;
  temporaryPassword: string;
}
export const sendAdminWelcomeEmail = async ({
  firstName,
  email,
  role,
  temporaryPassword,
}: WelcomeEmailInput): Promise<boolean> => {
  try {
    const template = adminAccountCreatedTemplate(
      firstName,
      email,
      role,
      temporaryPassword,
    );
    await queueEmail({
      to: email,
      subject: template.subject,
      htmlBody: template.htmlBody,
    });
    return true;
  } catch (error: any) {
    console.error("Failed to queue admin welcome email:", error.message);
    return false;
  }
};
