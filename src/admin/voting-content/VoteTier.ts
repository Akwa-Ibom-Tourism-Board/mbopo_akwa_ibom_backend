import { DataTypes, Model } from "sequelize";
import { database } from "../../configurations/database";

export interface VoteTierAttributes {
  id: string;
  votes: number;
  priceNaira: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class VoteTier extends Model<VoteTierAttributes> {}

VoteTier.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },
    votes: { type: DataTypes.INTEGER, allowNull: false },
    priceNaira: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    sequelize: database,
    tableName: "VoteTier",
    timestamps: true,
  },
);

export default VoteTier;
