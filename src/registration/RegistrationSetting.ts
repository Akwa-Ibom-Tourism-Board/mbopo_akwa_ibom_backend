import { DataTypes, Model } from "sequelize";
import { database } from "../configurations/database";
import { AdminUser } from "../admin/users/AdminUser";

export enum RegistrationStatus {
  Open = "open",
  // New sign-ups/applications are no longer accepted, but anyone who
  // already has an account can keep filling out and submitting theirs.
  NewIntakeClosed = "new_intake_closed",
  // Nobody — new or existing — can register, continue a draft, or submit.
  Closed = "closed",
}

export interface RegistrationSettingAttributes {
  // Singleton row — always 1. See registration.helpers.ts.
  id: number;
  status: RegistrationStatus;
  updatedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class RegistrationSetting extends Model<RegistrationSettingAttributes> {}

RegistrationSetting.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    status: {
      type: DataTypes.ENUM(...Object.values(RegistrationStatus)),
      allowNull: false,
      defaultValue: RegistrationStatus.Open,
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: AdminUser, key: "id" },
    },
  },
  {
    sequelize: database,
    tableName: "RegistrationSetting",
    timestamps: true,
  },
);

export default RegistrationSetting;
