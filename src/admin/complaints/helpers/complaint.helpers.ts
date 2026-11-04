import { Op } from "sequelize";
import { Message } from "../../../messages/Message";
import { MessageReply } from "../../../messages/MessageReply";
import { ComplainantReply } from "../../../messages/ComplainantReply";
import { User } from "../../../auth/User";
import { AdminUser, AdminRole } from "../../users/AdminUser";

/**
 * Shared by list.service.ts and get-one.service.ts — the admin Complaints
 * feature's view of a public-form Message, mirroring the admin frontend's
 * Complaint/ComplaintMessage shapes. "contestant"/"public" is inferred (the
 * Message table has no FK to User — a sender may or may not be a
 * registered applicant) by matching the submitted email against a
 * registered account; not authoritative, just a reasonable display hint.
 */
export async function serializeComplaint(
  message: Message,
  replies: MessageReply[],
  complainantReplies: ComplainantReply[],
  staffById: Map<string, AdminUser>,
  isRegisteredEmail: boolean,
  viewerRole: AdminRole,
) {
  const json: any = message.toJSON();

  const complainantMessage = {
    id: `${json.id}-original`,
    from: "complainant" as const,
    authorName: json.name,
    body: json.message,
    at: json.createdAt,
    attachments: json.attachments ?? [],
  };

  // Follow-up emails the complainant sent (to info@akhtdc.com.ng, picked up
  // by the Zoho Mail sync) onto this same thread, shown the same way as
  // the original message.
  const complainantFollowUps = complainantReplies.map((reply) => {
    const replyJson: any = reply.toJSON();
    return {
      id: replyJson.id,
      from: "complainant" as const,
      authorName: json.name,
      body: replyJson.body,
      at: replyJson.createdAt,
      attachments: replyJson.attachments ?? [],
    };
  });

  // Customer Service replies always show the responder's real name. Admin/
  // Super Admin replies show just "Admin" to everyone except a Super Admin
  // viewer, who can see exactly who on staff responded.
  const replyMessages = replies.map((reply) => {
    const replyJson: any = reply.toJSON();
    const staff = staffById.get(replyJson.staffId);
    const staffRole = staff?.get("role") as AdminRole | undefined;
    const realName = staff ? `${staff.get("firstName")} ${staff.get("lastName")}` : "Staff";
    const authorName =
      staffRole === AdminRole.CustomerService || viewerRole === AdminRole.SuperAdmin
        ? realName
        : "Admin";
    return {
      id: replyJson.id,
      from: "staff" as const,
      authorName,
      body: replyJson.body,
      at: replyJson.createdAt,
    };
  });

  return {
    id: json.id,
    subject: json.title || "General enquiry",
    source: isRegisteredEmail ? ("contestant" as const) : ("public" as const),
    // Distinct from the field above: whether this complaint arrived via
    // the "Ask Me" widget or was fetched from mail sent straight to
    // info@akhtdc.com.ng.
    channel: json.source as "widget" | "email",
    complainantName: json.name,
    complainantEmail: json.email,
    status: json.status,
    assignedToId: json.assignedToId ?? undefined,
    createdAt: json.createdAt,
    updatedAt: json.updatedAt,
    messages: [complainantMessage, ...complainantFollowUps, ...replyMessages].sort((a, b) =>
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
