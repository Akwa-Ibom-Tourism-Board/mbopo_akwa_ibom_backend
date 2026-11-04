import { DataTypes, Model } from "sequelize";
import { database } from "../configurations/database";
import { Message, MessageAttachment } from "./Message";

/**
 * A complainant's own follow-up email on an existing complaint thread —
 * the mirror of MessageReply, but authored by the complainant (via their
 * mail client replying to a staff email) instead of by staff. Created only
 * by zoho-mail-sync.service.ts, when an inbound email's sender matches an
 * existing Message's email address.
 */
export interface ComplainantReplyAttributes {
  id: string;
  messageId: string;
  body: string;
  attachments: MessageAttachment[];
  // Dedup key for the sync job, same role as Message.zohoMessageId.
  zohoMessageId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ComplainantReply extends Model<ComplainantReplyAttributes> {}

ComplainantReply.init(
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
    body: { type: DataTypes.TEXT, allowNull: false },
    attachments: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    zohoMessageId: { type: DataTypes.STRING, allowNull: false, unique: true },
  },
  {
    sequelize: database,
    tableName: "ComplainantReply",
    timestamps: true,
  },
);

export default ComplainantReply;
