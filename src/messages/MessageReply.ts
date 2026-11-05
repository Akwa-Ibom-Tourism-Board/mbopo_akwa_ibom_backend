import { DataTypes, Model } from "sequelize";
import { database } from "../configurations/database";
import { Message } from "./Message";
import { AdminUser } from "../admin/users/AdminUser";

// Whether the notification email for this reply actually reached the
// complainant — distinct from the reply itself existing. "pending" covers
// both "still queued" and "in flight"; it only becomes sent/failed once
// email-queue.ts's onEmailResult hook (wired up in
// reply-email-status.subscriber.ts) reports the job's final outcome.
export enum ReplyEmailStatus {
  Pending = "pending",
  Sent = "sent",
  Failed = "failed",
}

export interface MessageReplyAttributes {
  id: string;
  messageId: string;
  staffId: string;
  body: string;
  emailStatus: ReplyEmailStatus;
  emailError?: string | null;
  emailSentAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class MessageReply extends Model<MessageReplyAttributes> {}

MessageReply.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },
    messageId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: Message, key: "id" },
    },
    staffId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: AdminUser, key: "id" },
    },
    body: { type: DataTypes.TEXT, allowNull: false },
    emailStatus: {
      type: DataTypes.ENUM(...Object.values(ReplyEmailStatus)),
      allowNull: false,
      defaultValue: ReplyEmailStatus.Pending,
    },
    emailError: { type: DataTypes.TEXT, allowNull: true },
    emailSentAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize: database,
    tableName: "MessageReply",
    timestamps: true,
  },
);

export default MessageReply;
