import { DataTypes, Model } from "sequelize";
import { database } from "../../configurations/database";
import { User } from "../../auth/User";

export enum ApplicationStatus {
  Draft = "draft",
  Submitted = "submitted",
}

export interface ApplicationAttributes {
  id: string;
  applicantId: string;
  middleName?: string | null;
  phone?: string | null;
  socialMedia?: string | null;
  nextOfKin?: string | null;
  nextOfKinPhone?: string | null;
  village?: string | null;
  residenceState?: string | null;
  city?: string | null;
  address?: string | null;
  education?: string | null;
  institution?: string | null;
  occupation?: string | null;
  talents?: string | null;
  languages?: string | null;
  initiative?: string | null;
  why?: string | null;
  declarationIdentity?: boolean | null;
  declarationAccuracy?: boolean | null;
  declarationTerms?: boolean | null;
  passportPhotoUrl?: string | null;
  certificateOfOriginUrl?: string | null;
  fullImageUrl?: string | null;
  status: ApplicationStatus;
  referenceCode?: string | null;
  submittedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Application extends Model<ApplicationAttributes> {}

Application.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },

    // One application per applicant, enforced at the DB level via this
    // unique index — not by an application-level check. See BUILD_ME.md §10.
    applicantId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: {
        name: "Application_applicantId_key",
        msg: "An application already exists for this account",
      },
      references: {
        model: User,
        key: "id",
      },
    },

    middleName: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    socialMedia: { type: DataTypes.STRING, allowNull: true },
    nextOfKin: { type: DataTypes.STRING, allowNull: true },
    nextOfKinPhone: { type: DataTypes.STRING, allowNull: true },
    village: { type: DataTypes.STRING, allowNull: true },
    residenceState: { type: DataTypes.STRING, allowNull: true },
    city: { type: DataTypes.STRING, allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    education: { type: DataTypes.STRING, allowNull: true },
    institution: { type: DataTypes.STRING, allowNull: true },
    occupation: { type: DataTypes.STRING, allowNull: true },
    talents: { type: DataTypes.TEXT, allowNull: true },
    languages: { type: DataTypes.STRING, allowNull: true },
    initiative: { type: DataTypes.TEXT, allowNull: true },
    why: { type: DataTypes.TEXT, allowNull: true },

    declarationIdentity: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    declarationAccuracy: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    declarationTerms: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },

    passportPhotoUrl: { type: DataTypes.TEXT, allowNull: true },
    certificateOfOriginUrl: { type: DataTypes.TEXT, allowNull: true },
    fullImageUrl: { type: DataTypes.TEXT, allowNull: true },

    status: {
      type: DataTypes.ENUM(...Object.values(ApplicationStatus)),
      allowNull: false,
      defaultValue: ApplicationStatus.Draft,
      validate: {
        isIn: [Object.values(ApplicationStatus)],
      },
    },

    referenceCode: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: {
        name: "Application_referenceCode_key",
        msg: "Reference code already in use",
      },
    },

    submittedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize: database,
    tableName: "Application",
    timestamps: true,
  },
);

export default Application;
