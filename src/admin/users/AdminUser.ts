import { DataTypes, Model } from "sequelize";
import { database } from "../../configurations/database";
import { toTitleCase } from "../../auth/auth.helpers";

// Mirrors mbopo_akwa_ibom_admin_frontend's src/lib/rbac.ts Role union
// exactly — the two must be kept in sync by hand (separate repos, no
// shared package). "super_admin" is deliberately never assignable through
// any API — see admin/helpers/admin-users.helpers.ts.
export enum AdminRole {
  SuperAdmin = "super_admin",
  Admin = "admin",
  Media = "media",
  Judge = "judge",
  HeadJudge = "head_judge",
  CustomerService = "customer_service",
}

export interface AdminUserAttributes {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: AdminRole;
  active: boolean;
  passwordChangedAt?: Date | null;
  refreshToken?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class AdminUser extends Model<AdminUserAttributes> {}

AdminUser.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },

    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      get() {
        return toTitleCase(this.getDataValue("firstName"));
      },
      set(value: string) {
        this.setDataValue("firstName", toTitleCase(value) as string);
      },
    },

    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      get() {
        return toTitleCase(this.getDataValue("lastName"));
      },
      set(value: string) {
        this.setDataValue("lastName", toTitleCase(value) as string);
      },
    },

    email: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: {
        name: "AdminUser_email_key",
        msg: "Email already in use",
      },
      set(value: string) {
        this.setDataValue("email", value.trim().toLowerCase());
      },
    },

    passwordHash: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    role: {
      type: DataTypes.ENUM(...Object.values(AdminRole)),
      allowNull: false,
      validate: {
        isIn: [Object.values(AdminRole)],
      },
    },

    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    passwordChangedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Only a hash is stored — same rationale as User.refreshToken: a leaked
    // database dump can't be replayed as a live session.
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize: database,
    tableName: "AdminUser",
    timestamps: true,
  },
);

export default AdminUser;
