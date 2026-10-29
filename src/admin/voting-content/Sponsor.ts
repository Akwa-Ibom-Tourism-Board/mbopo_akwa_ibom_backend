import { DataTypes, Model } from "sequelize";
import { database } from "../../configurations/database";

export interface SponsorAttributes {
  id: string;
  name: string;
  description?: string | null;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  logoPublicId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Sponsor extends Model<SponsorAttributes> {}

Sponsor.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    websiteUrl: { type: DataTypes.TEXT, allowNull: true },
    logoUrl: { type: DataTypes.TEXT, allowNull: true },
    logoPublicId: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize: database,
    tableName: "Sponsor",
    timestamps: true,
  },
);

export default Sponsor;
