import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { User } from "../../../auth/User";
import { Message, MessageSource, MessageStatus } from "../../../messages/Message";
import { MessageReply, ReplyEmailStatus } from "../../../messages/MessageReply";
import { queueEmail } from "../../../configurations/email-queue";
import { COMPLAINT_REPLY_EMAIL_META_KIND } from "../../../messages/services/reply-email-status.subscriber";
import { adminMessageTemplate } from "../../../messages/emailTemplates/adminMessage";
import { recordActivity } from "../../helpers/activity.helpers";

const PLACEHOLDER_OPENING_MESSAGE = "This conversation was started by the Mbopo Akwa Ibom team.";

// Starts a complaint-style email thread from the admin side — same
// Message/MessageReply shapes and the exact same queueEmail/delivery-status
// machinery as replying to a complaint (reply.service.ts), just with no
// prior complaint to reply to. The resulting thread shows up in the normal
// Complaints inbox like any other, tagged source: "admin" so staff can tell
// it was staff-initiated, not something the participant sent in.
const messageParticipantService = errorUtilities.withServiceErrorHandling(
  async (staffId: string, participantId: string, subject: string, body: string) => {
    const user = await User.findByPk(participantId);
    if (!user) {
      throw errorUtilities.createError("Participant not found", StatusCodes.NOT_FOUND);
    }

    const name = [user.get("firstName"), user.get("lastName")].filter(Boolean).join(" ") || "Applicant";
    const email = user.get("email") as string;

    const message = await Message.create({
      name,
      email,
      phoneNumber: (user.get("phoneNumber") as string | null) ?? "",
      title: subject,
      message: PLACEHOLDER_OPENING_MESSAGE,
      attachments: [],
      read: true,
      status: MessageStatus.InProgress,
      source: MessageSource.Admin,
    } as any);

    const reply = await MessageReply.create({
      messageId: message.get("id"),
      staffId,
      body,
      emailStatus: ReplyEmailStatus.Pending,
    } as any);

    // Same never-fail-the-request rule as reply.service.ts: the message and
    // the reply are already saved; a delivery failure only changes this
    // reply's own emailStatus, reported asynchronously as usual.
    try {
      const template = adminMessageTemplate(
        (user.get("firstName") as string | null) ?? "there",
        subject,
        body,
      );
      await queueEmail(
        { to: email, subject: template.subject, htmlBody: template.htmlBody },
        { kind: COMPLAINT_REPLY_EMAIL_META_KIND, replyId: reply.get("id") },
      );
    } catch (error: any) {
      console.error("Failed to queue admin-message email:", error.message);
      await reply.update({
        emailStatus: ReplyEmailStatus.Failed,
        emailError: error.message,
      } as any);
    }

    await recordActivity(staffId, "complaints", `Started a conversation with ${name}: "${subject}"`);

    return responseUtilities.handleServicesResponse(
      StatusCodes.CREATED,
      "Message sent",
      { messageId: message.get("id") },
    );
  },
);

export default messageParticipantService;
