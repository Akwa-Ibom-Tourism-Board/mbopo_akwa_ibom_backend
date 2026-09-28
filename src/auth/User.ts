import { DataTypes, Model } from "sequelize";
import { database } from "../configurations/database";
import { NIGERIAN_PHONE_REGEX } from "../configurations/constants";
import { toTitleCase } from "./auth.helpers";

export enum Gender {
  Male = "male",
  Female = "female",
}

export interface UserAttributes {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  nin: string;
  vin: string;
  gender: Gender;
  dateOfBirth: string;
  localGovernment: string;
  ward: string;
  emailVerified: boolean;
  emailOtpHash?: string | null;
  emailOtpExpiresAt?: Date | null;
  emailOtpAttempts: number;
  passwordResetTokenHash?: string | null;
  passwordResetExpiresAt?: Date | null;
  refreshToken?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User extends Model<UserAttributes> {}

User.init(
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
        name: "User_email_key",
        msg: "Email already in use",
      },
      set(value: string) {
        this.setDataValue("email", value.trim().toLowerCase());
      },
    },

    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: {
          args: NIGERIAN_PHONE_REGEX,
          msg: "Invalid Nigerian phone number format",
        },
      },
    },

    password: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    nin: {
      type: DataTypes.STRING(11),
      allowNull: false,
      unique: {
        name: "User_nin_key",
        msg: "This NIN is already registered",
      },
      validate: {
        len: {
          args: [11, 11],
          msg: "NIN must be exactly 11 digits",
        },
      },
    },

    vin: {
      type: DataTypes.STRING(19),
      allowNull: false,
      unique: {
        name: "User_vin_key",
        msg: "This VIN is already registered",
      },
      validate: {
        len: {
          args: [19, 19],
          msg: "VIN must be exactly 19 characters",
        },
      },
    },

    gender: {
      type: DataTypes.ENUM(...Object.values(Gender)),
      allowNull: false,
      validate: {
        isIn: [Object.values(Gender)],
      },
    },

    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    localGovernment: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    ward: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    emailOtpHash: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    emailOtpExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    emailOtpAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    passwordResetTokenHash: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    passwordResetExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize: database,
    tableName: "User",
    timestamps: true,
  },
);

export default User;
