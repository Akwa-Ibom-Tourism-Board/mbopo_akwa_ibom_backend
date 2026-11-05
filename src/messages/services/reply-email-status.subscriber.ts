import { onEmailResult } from "../../configurations/email-queue";
import { MessageReply, ReplyEmailStatus } from "../MessageReply";

/** The `meta.kind` tag reply.service.ts/resend-reply-email.service.ts attach to their queueEmail() calls. */
export const COMPLAINT_REPLY_EMAIL_META_KIND = "complaint-reply";

// Registered once at boot (see app.ts) — email-queue.ts stays generic and
// knows nothing about MessageReply; this is the one place that translates
// "this queued email's job finally settled" into "mark this specific reply
// row sent/failed".
export const registerReplyEmailStatusSubscriber = (): void => {
  onEmailResult(async (result, meta) => {
    if (meta?.kind !== COMPLAINT_REPLY_EMAIL_META_KIND) return;
    const replyId = meta.replyId as string | undefined;
    if (!replyId) return;

    const reply = await MessageReply.findByPk(replyId);
    if (!reply) return; // Reply (or its complaint) was deleted since.

    if (result.status === "sent") {
      await reply.update({
        emailStatus: ReplyEmailStatus.Sent,
        emailError: null,
        emailSentAt: new Date(),
      } as any);
    } else {
      await reply.update({
        emailStatus: ReplyEmailStatus.Failed,
        emailError: result.error,
      } as any);
    }
  });
};

export default registerReplyEmailStatusSubscriber;
