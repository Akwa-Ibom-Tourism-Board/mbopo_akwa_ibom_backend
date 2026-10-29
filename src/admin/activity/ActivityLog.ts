import { DataTypes, Model } from "sequelize";
import { database } from "../../configurations/database";
import { AdminUser } from "../users/AdminUser";
import { Application } from "../../applicants/application/Application";

// Mirrors mbopo_akwa_ibom_admin_frontend's ActivityCategory union — keep
// the two in sync by hand.
export type ActivityCategory =
  | "users"
  | "judging"
  | "voting"
  | "candidates"
  | "complaints"
  | "access";

export interface ActivityLogAttributes {
  id: string;
  // Null for a system event (none currently generated, but the column
  // stays nullable for that case rather than requiring a fake actor).
  actorId?: string | null;
  // Set when this entry belongs to one candidate's own Activity tab, in
  // addition to appearing in the global log.
  applicationId?: string | null;
  category: ActivityCategory;
  summary: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ActivityLog extends Model<ActivityLogAttributes> {}

ActivityLog.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },
    actorId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: AdminUser, key: "id" },
    },
    applicationId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: Application, key: "id" },
    },
    category: { type: DataTypes.STRING(32), allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: false },
  },
  {
    sequelize: database,
    tableName: "ActivityLog",
    timestamps: true,
  },
);

export default ActivityLog;
