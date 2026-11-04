import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { StatusCodes } from "../../configurations/statusCodes";
import configurations from "../../configurations";
import { queueEmail } from "../../configurations/email-queue";
import { Message, MessageAttachment } from "../Message";
import { newMessageTemplate } from "../emailTemplates/newMessage";
import { messageReceivedTemplate } from "../emailTemplates/messageReceived";
import { assertValidComplaintAttachmentUrl } from "../../configurations/cloudinary";

export interface CreateMessagePayload {
  name: string;
  email: string;
  phoneNumber: string;
  title?: string;
  message: string;
  attachments?: MessageAttachment[];
}

const createMessageService = errorUtilities.withServiceErrorHandling(
  async (payload: CreateMessagePayload) => {
    // Re-checked here, not just trusted from the signed-upload step — a
    // client could otherwise submit any URL it likes in this field.
    for (const attachment of payload.attachments ?? []) {
      assertValidComplaintAttachmentUrl(attachment.url);
    }

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

    // Best-effort confirmation to the complainant themselves — same
    // never-fail-the-submission rule as the staff alert above.
    try {
      const confirmation = messageReceivedTemplate(payload.name);
      await queueEmail({
        to: payload.email,
        subject: confirmation.subject,
        htmlBody: confirmation.htmlBody,
      });
    } catch (error: any) {
      console.error("Failed to queue message-received email:", error.message);
    }

    return responseUtilities.handleServicesResponse(
      StatusCodes.CREATED,
      "Your message has been sent. We'll get back to you soon.",
    );
  },
);

export default createMessageService;
