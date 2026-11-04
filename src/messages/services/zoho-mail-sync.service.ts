import { Op } from "sequelize";
import { Message, MessageAttachment, MessageSource, MessageStatus } from "../Message";
import { ComplainantReply } from "../ComplainantReply";
import {
  isZohoMailConfigured,
  listInboxMessages,
  getMessageContent,
  downloadAttachment,
  markMessagesRead,
  ZohoAttachmentInfo,
} from "../../configurations/zoho-mail";
import { uploadEmailAttachmentToCloudinary, MAX_COMPLAINT_ATTACHMENTS } from "../../configurations/cloudinary";

// Our own sending addresses — a guard in case an outgoing reply (now sent
// "from" info@akhtdc.com.ng — see email-sender.ts) ever lands back in this
// same Inbox (e.g. via a stray auto-forward rule), so it's never mistaken
// for an inbound complaint.
const OWN_ADDRESSES = new Set(["info@akhtdc.com.ng", "no-reply@akhtdc.com.ng"]);

const parseSenderName = (senderHeader: string, fromAddress: string): string => {
  // Zoho's "sender" field is typically `"Jane Doe" <jane@example.com>`, but
  // falls back to a bare address for mail with no display name.
  const match = senderHeader.match(/^"?([^"<]*)"?\s*<[^>]*>$/);
  const name = match?.[1]?.trim();
  return name || fromAddress.split("@")[0] || "Unknown sender";
};

const collectAttachments = async (
  messageId: string,
  infos: ZohoAttachmentInfo[],
): Promise<MessageAttachment[]> => {
  const attachments: MessageAttachment[] = [];
  for (let i = 0; i < infos.length && attachments.length < MAX_COMPLAINT_ATTACHMENTS; i++) {
    const info = infos[i]!;
    try {
      const buffer = await downloadAttachment(messageId, info.attachmentId);
      const uploaded = await uploadEmailAttachmentToCloudinary(messageId, i, buffer, info.attachmentName);
      if (uploaded) {
        attachments.push({ url: uploaded.url, filename: info.attachmentName, bytes: uploaded.bytes });
      }
      // else: an unsupported attachment type (not image/PDF) — silently
      // skipped, matching the widget's own allowed-formats restriction.
    } catch (error: any) {
      console.error(
        `Zoho mail sync: failed to fetch attachment "${info.attachmentName}" on message ${messageId}:`,
        error.message,
      );
    }
  }
  return attachments;
};

export interface ZohoMailSyncResult {
  fetched: number;
  newComplaints: number;
  newReplies: number;
}

/**
 * Pulls recent mail from the info@akhtdc.com.ng inbox and saves it into the
 * existing complaints system: a brand-new sender becomes a new complaint
 * (Message, source="email"); an email from someone who already has a
 * complaint on file threads onto it instead (ComplainantReply), reopening
 * it if it had been marked resolved. Previously-fetched widget complaints
 * are completely untouched by this — it only ever adds rows.
 *
 * Dedup is by Zoho's own messageId (unique on both Message and
 * ComplainantReply), not a time cursor — simplest way to be safe against a
 * missed poll, a process restart, or (since pm2 runs more than one
 * instance) two instances polling at once: whichever instance's insert
 * loses the unique-constraint race just skips that message.
 */
export const syncZohoMail = async (): Promise<ZohoMailSyncResult> => {
  if (!isZohoMailConfigured()) {
    return { fetched: 0, newComplaints: 0, newReplies: 0 };
  }

  const summaries = await listInboxMessages(50);
  if (!summaries.length) return { fetched: 0, newComplaints: 0, newReplies: 0 };

  const ids = summaries.map((s) => s.messageId);
  const [seenAsComplaint, seenAsReply] = await Promise.all([
    Message.findAll({ where: { zohoMessageId: { [Op.in]: ids } }, attributes: ["zohoMessageId"] }),
    ComplainantReply.findAll({ where: { zohoMessageId: { [Op.in]: ids } }, attributes: ["zohoMessageId"] }),
  ]);
  const alreadyProcessed = new Set([
    ...seenAsComplaint.map((m) => m.get("zohoMessageId") as string),
    ...seenAsReply.map((r) => r.get("zohoMessageId") as string),
  ]);

  // Oldest-first: if the same sender emailed twice since the last poll, the
  // first creates the complaint and the second correctly threads onto it.
  const toProcess = summaries
    .filter((s) => !alreadyProcessed.has(s.messageId) && !OWN_ADDRESSES.has(s.fromAddress))
    .reverse();

  let newComplaints = 0;
  let newReplies = 0;
  const processedIds: string[] = [];

  for (const summary of toProcess) {
    try {
      const content = await getMessageContent(summary.messageId);
      const senderEmail = (content.fromAddress || summary.fromAddress || "").toLowerCase();
      if (!senderEmail || OWN_ADDRESSES.has(senderEmail)) {
        processedIds.push(summary.messageId);
        continue;
      }

      const senderName = parseSenderName(summary.sender, senderEmail);
      const body = content.content || "(no message body)";
      const attachments = await collectAttachments(summary.messageId, content.attachments);

      const existingComplaint = await Message.findOne({
        where: { email: senderEmail },
        order: [["createdAt", "DESC"]],
      });

      if (existingComplaint) {
        await ComplainantReply.create({
          messageId: existingComplaint.get("id") as string,
          body,
          attachments,
          zohoMessageId: summary.messageId,
        } as any);
        if (existingComplaint.get("status") === MessageStatus.Resolved) {
          await existingComplaint.update({ status: MessageStatus.InProgress } as any);
        }
        newReplies += 1;
      } else {
        await Message.create({
          name: senderName,
          email: senderEmail,
          phoneNumber: "",
          title: content.subject || summary.subject || null,
          message: body,
          attachments,
          read: false,
          status: MessageStatus.Open,
          source: MessageSource.Email,
          zohoMessageId: summary.messageId,
        } as any);
        newComplaints += 1;
      }

      processedIds.push(summary.messageId);
    } catch (error: any) {
      // Another pm2 instance won the race to this same message — not a
      // real failure.
      if (error?.name === "SequelizeUniqueConstraintError") {
        processedIds.push(summary.messageId);
        continue;
      }
      console.error(`Zoho mail sync: failed to process message ${summary.messageId}:`, error.message);
    }
  }

  if (processedIds.length) {
    try {
      await markMessagesRead(processedIds);
    } catch (error: any) {
      console.error("Zoho mail sync: failed to mark messages read in Zoho:", error.message);
    }
  }

  if (newComplaints || newReplies) {
    console.log(`📨 Zoho mail sync: ${newComplaints} new complaint(s), ${newReplies} new reply/replies`);
  }

  return { fetched: summaries.length, newComplaints, newReplies };
};

export default syncZohoMail;
