import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { Message } from "../../../messages/Message";
import { MessageReply, ReplyEmailStatus } from "../../../messages/MessageReply";
import { queueEmail } from "../../../configurations/email-queue";
import { COMPLAINT_REPLY_EMAIL_META_KIND } from "../../../messages/services/reply-email-status.subscriber";
import { complaintReplyTemplate } from "../../../messages/emailTemplates/complaintReply";

const resendReplyEmailService = errorUtilities.withServiceErrorHandling(
  async (complaintId: string, replyId: string) => {
    const message = await Message.findByPk(complaintId);
    if (!message) {
      throw errorUtilities.createError("Complaint not found", StatusCodes.NOT_FOUND);
    }

    const reply = await MessageReply.findOne({ where: { id: replyId, messageId: complaintId } });
    if (!reply) {
      throw errorUtilities.createError("Reply not found", StatusCodes.NOT_FOUND);
    }

    await reply.update({ emailStatus: ReplyEmailStatus.Pending, emailError: null } as any);

    try {
      const template = complaintReplyTemplate(message.get("name") as string, reply.get("body") as string);
      await queueEmail(
        {
          to: message.get("email") as string,
          subject: template.subject,
          htmlBody: template.htmlBody,
        },
        { kind: COMPLAINT_REPLY_EMAIL_META_KIND, replyId: reply.get("id") },
      );
    } catch (error: any) {
      await reply.update({
        emailStatus: ReplyEmailStatus.Failed,
        emailError: error.message,
      } as any);
      throw errorUtilities.createError(
        "Could not resend the email. Please try again.",
        StatusCodes.BAD_GATEWAY,
      );
    }

    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Email resend queued");
  },
);

export default resendReplyEmailService;
