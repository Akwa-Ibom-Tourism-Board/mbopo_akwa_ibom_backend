import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { Message, MessageStatus } from "../../../messages/Message";
import { MessageReply, ReplyEmailStatus } from "../../../messages/MessageReply";
import { queueEmail } from "../../../configurations/email-queue";
import { COMPLAINT_REPLY_EMAIL_META_KIND } from "../../../messages/services/reply-email-status.subscriber";
import { complaintReplyTemplate } from "../../../messages/emailTemplates/complaintReply";
import { recordActivity } from "../../helpers/activity.helpers";

const replyToComplaintService = errorUtilities.withServiceErrorHandling(
  async (staffId: string, id: string, body: string) => {
    const message = await Message.findByPk(id);
    if (!message) {
      throw errorUtilities.createError("Complaint not found", StatusCodes.NOT_FOUND);
    }

    const reply = await MessageReply.create({
      messageId: id,
      staffId,
      body,
      emailStatus: ReplyEmailStatus.Pending,
    } as any);

    if (message.get("status") === MessageStatus.Open) {
      await message.update({ status: MessageStatus.InProgress } as any);
    }

    // The reply itself is already saved regardless of what happens below —
    // a delivery failure must never fail the request. What it DOES change
    // is this reply's own emailStatus, which is how staff find out the
    // email didn't actually go out (see reply-email-status.subscriber.ts
    // for the sent/failed side of this, reported asynchronously once the
    // queued job settles).
    try {
      const template = complaintReplyTemplate(message.get("name") as string, body);
      await queueEmail(
        {
          to: message.get("email") as string,
          subject: template.subject,
          htmlBody: template.htmlBody,
        },
        { kind: COMPLAINT_REPLY_EMAIL_META_KIND, replyId: reply.get("id") },
      );
    } catch (error: any) {
      console.error("Failed to queue complaint-reply email:", error.message);
      await reply.update({
        emailStatus: ReplyEmailStatus.Failed,
        emailError: error.message,
      } as any);
    }

    await recordActivity(
      staffId,
      "complaints",
      `Replied to complaint "${message.get("title") || "General enquiry"}"`,
    );

    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Reply sent");
  },
);

export default replyToComplaintService;
