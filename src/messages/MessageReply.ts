import { DataTypes, Model } from "sequelize";
import { database } from "../configurations/database";
import { Message } from "./Message";
import { AdminUser } from "../admin/users/AdminUser";

export interface MessageReplyAttributes {
  id: string;
  messageId: string;
  staffId: string;
  body: string;
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
  },
  {
    sequelize: database,
    tableName: "MessageReply",
    timestamps: true,
  },
);

export default MessageReply;
