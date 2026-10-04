import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { StatusCodes } from "../../configurations/statusCodes";
import configurations from "../../configurations";
import { queueEmail } from "../../configurations/email-queue";
import { Message } from "../Message";
import { newMessageTemplate } from "../emailTemplates/newMessage";

export interface CreateMessagePayload {
  name: string;
  email: string;
  phoneNumber: string;
  title?: string;
  message: string;
}

const createMessageService = errorUtilities.withServiceErrorHandling(
  async (payload: CreateMessagePayload) => {
    await Message.create({ ...payload, read: false } as any);

    // Best-effort staff alert. The message is already saved, so a missing
    // recipient or a queue failure must never fail the submission.
    const recipient = configurations.MESSAGES_NOTIFY_EMAIL;
    if (recipient) {
      try {
        const template = newMessageTemplate(payload);
        await queueEmail({ to: recipient, subject: template.subject, htmlBody: template.htmlBody });
      } catch (error: any) {
        console.error("Failed to queue new-message email:", error.message);
      }
    }

    return responseUtilities.handleServicesResponse(
      StatusCodes.CREATED,
      "Your message has been sent. We'll get back to you soon.",
    );
  },
);

export default createMessageService;
