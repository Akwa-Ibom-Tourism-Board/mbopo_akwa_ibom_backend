import { DataTypes, Model } from "sequelize";
import { database } from "../configurations/database";
import { User } from "../auth/User";

export enum NotificationType {
  Account = "account",
  Application = "application",
  System = "system",
}

export interface NotificationAttributes {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  read: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Notification extends Model<NotificationAttributes> {}

Notification.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },

    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    type: {
      type: DataTypes.ENUM(...Object.values(NotificationType)),
      allowNull: false,
      defaultValue: NotificationType.System,
      validate: {
        isIn: [Object.values(NotificationType)],
      },
    },

    read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize: database,
    tableName: "Notification",
    timestamps: true,
    indexes: [
      // Every read path filters by userId, most also by (userId, read) for
      // the unread-count/unread-list queries — see §11 of BUILD_ME.md
      // ("index every column used in a WHERE").
      { fields: ["userId"] },
      { fields: ["userId", "read"] },
    ],
  },
);

export default Notification;
