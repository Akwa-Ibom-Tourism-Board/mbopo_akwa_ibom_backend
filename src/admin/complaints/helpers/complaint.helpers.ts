import { Op } from "sequelize";
import { Message } from "../../../messages/Message";
import { MessageReply } from "../../../messages/MessageReply";
import { User } from "../../../auth/User";
import { AdminUser } from "../../users/AdminUser";

/**
 * Shared by list.service.ts and get-one.service.ts — the admin Complaints
 * feature's view of a public-form Message, mirroring the admin frontend's
 * Complaint/ComplaintMessage shapes. "source" is inferred (the Message
 * table has no FK to User — a sender may or may not be a registered
 * applicant) by matching the submitted email against a registered account;
 * not authoritative, just a reasonable display hint.
 */
export async function serializeComplaint(
  message: Message,
  replies: MessageReply[],
  staffById: Map<string, AdminUser>,
  isRegisteredEmail: boolean,
) {
  const json: any = message.toJSON();

  const complainantMessage = {
    id: `${json.id}-original`,
    from: "complainant" as const,
    authorName: json.name,
    body: json.message,
    at: json.createdAt,
  };

  const replyMessages = replies.map((reply) => {
    const replyJson: any = reply.toJSON();
    const staff = staffById.get(replyJson.staffId);
    return {
      id: replyJson.id,
      from: "staff" as const,
      authorName: staff ? `${staff.get("firstName")} ${staff.get("lastName")}` : "Staff",
      body: replyJson.body,
      at: replyJson.createdAt,
    };
  });

  return {
    id: json.id,
    subject: json.title || "General enquiry",
    source: isRegisteredEmail ? ("contestant" as const) : ("public" as const),
    complainantName: json.name,
    complainantEmail: json.email,
    status: json.status,
    assignedToId: json.assignedToId ?? undefined,
    createdAt: json.createdAt,
    updatedAt: json.updatedAt,
    messages: [complainantMessage, ...replyMessages].sort((a, b) =>
      String(a.at).localeCompare(String(b.at)),
    ),
  };
}

export async function registeredEmailSet(emails: string[]): Promise<Set<string>> {
  if (!emails.length) return new Set();
  const users = await User.findAll({
    where: { email: { [Op.in]: emails.map((e) => e.toLowerCase()) } },
    attributes: ["email"],
  });
  return new Set(users.map((u) => (u.get("email") as string).toLowerCase()));
}
