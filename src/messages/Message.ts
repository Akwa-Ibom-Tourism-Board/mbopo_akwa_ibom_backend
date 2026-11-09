import { DataTypes, Model } from "sequelize";
import { database } from "../configurations/database";

export enum MessageStatus {
  Open = "open",
  InProgress = "in_progress",
  Resolved = "resolved",
}

export interface MessageAttachment {
  url: string;
  filename: string;
  bytes: number;
}

export enum MessageSource {
  Widget = "widget",
  Email = "email",
  // Started by staff from the admin Participants view (see
  // admin/participants/services/message.service.ts), not by the applicant.
  Admin = "admin",
}

export interface MessageAttributes {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  title?: string | null;
  message: string;
  attachments: MessageAttachment[];
  read: boolean;
  // Admin-side complaints workflow (Stage 7). "read" above predates this
  // and stays as-is (still set by whatever already reads it); status is
  // the richer 3-state workflow the admin Complaints feature uses.
  status: MessageStatus;
  assignedToId?: string | null;
  // Where this complaint originated. "email" rows are created by the Zoho
  // Mail sync (zoho-mail-sync.service.ts) from mail sent directly to
  // info@akhtdc.com.ng, rather than the "Ask Me" widget.
  source: MessageSource;
  // The Zoho message that created this row, for dedup across polls. Only
  // set on source="email" rows — null (not empty string) for widget
  // submissions, which Postgres allows any number of under a unique index.
  zohoMessageId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Standalone inbox for the public contact form — deliberately no userId:
// the sender may or may not be a registered applicant.
export class Message extends Model<MessageAttributes> {}

Message.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.TEXT, allowNull: false },
    phoneNumber: { type: DataTypes.STRING, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: true },
    message: { type: DataTypes.TEXT, allowNull: false },
    attachments: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    // Lets staff track what has been handled.
    read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    status: {
      type: DataTypes.ENUM(...Object.values(MessageStatus)),
      allowNull: false,
      defaultValue: MessageStatus.Open,
    },
    assignedToId: { type: DataTypes.UUID, allowNull: true },
    source: {
      type: DataTypes.ENUM(...Object.values(MessageSource)),
      allowNull: false,
      defaultValue: MessageSource.Widget,
    },
    zohoMessageId: { type: DataTypes.STRING, allowNull: true, unique: true },
  },
  {
    sequelize: database,
    tableName: "Message",
    timestamps: true,
    // Staff inbox view: unread first / newest first.
    indexes: [{ fields: ["read", "createdAt"] }],
  },
);

export default Message;
