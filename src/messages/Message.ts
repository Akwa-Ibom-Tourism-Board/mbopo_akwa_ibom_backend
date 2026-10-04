import { DataTypes, Model } from "sequelize";
import { database } from "../configurations/database";

export interface MessageAttributes {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  title?: string | null;
  message: string;
  read: boolean;
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
    // Lets staff track what has been handled.
    read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
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
