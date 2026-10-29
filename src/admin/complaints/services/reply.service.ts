import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { Message, MessageStatus } from "../../../messages/Message";
import { MessageReply } from "../../../messages/MessageReply";
import { queueEmail } from "../../../configurations/email-queue";
import { complaintReplyTemplate } from "../../../messages/emailTemplates/complaintReply";
import { recordActivity } from "../../helpers/activity.helpers";

const replyToComplaintService = errorUtilities.withServiceErrorHandling(
  async (staffId: string, id: string, body: string) => {
    const message = await Message.findByPk(id);
    if (!message) {
      throw errorUtilities.createError("Complaint not found", StatusCodes.NOT_FOUND);
    }

    await MessageReply.create({ messageId: id, staffId, body } as any);

    if (message.get("status") === MessageStatus.Open) {
      await message.update({ status: MessageStatus.InProgress } as any);
    }

    // Best-effort, like every other email call site: the reply is already
    // saved, so a delivery failure must never fail the request.
    try {
      const template = complaintReplyTemplate(message.get("name") as string, body);
      await queueEmail({
        to: message.get("email") as string,
        subject: template.subject,
        htmlBody: template.htmlBody,
      });
    } catch (error: any) {
      console.error("Failed to queue complaint-reply email:", error.message);
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
