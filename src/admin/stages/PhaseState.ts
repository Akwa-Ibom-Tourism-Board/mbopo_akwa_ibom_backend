import { DataTypes, Model } from "sequelize";
import { database } from "../../configurations/database";
import { AdminUser } from "../users/AdminUser";

export enum PhaseStatus {
  Pending = "pending",
  Open = "open",
  Closed = "closed",
}

export interface PhaseStateAttributes {
  // One of the 7 fixed phase ids — see admin/judging/phases.config.ts.
  phaseId: string;
  status: PhaseStatus;
  openedAt?: Date | null;
  openedBy?: string | null;
  closedAt?: Date | null;
  closedBy?: string | null;
  // Judge ids whose scores counted, frozen at close time — see
  // phase-state.helpers.ts's countedJudges().
  countedJudgeIds?: string[] | null;
  resultsSubmittedAt?: Date | null;
  resultsSubmittedBy?: string | null;
  reopenedAt?: Date | null;
  reopenedBy?: string | null;
  passedIds?: string[] | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PhaseState extends Model<PhaseStateAttributes> {}

PhaseState.init(
  {
    phaseId: { type: DataTypes.STRING(16), primaryKey: true, allowNull: false },
    status: {
      type: DataTypes.ENUM(...Object.values(PhaseStatus)),
      allowNull: false,
      defaultValue: PhaseStatus.Pending,
    },
    openedAt: { type: DataTypes.DATE, allowNull: true },
    openedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: AdminUser, key: "id" },
    },
    closedAt: { type: DataTypes.DATE, allowNull: true },
    closedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: AdminUser, key: "id" },
    },
    countedJudgeIds: { type: DataTypes.JSONB, allowNull: true },
    resultsSubmittedAt: { type: DataTypes.DATE, allowNull: true },
    resultsSubmittedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: AdminUser, key: "id" },
    },
    reopenedAt: { type: DataTypes.DATE, allowNull: true },
    reopenedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: AdminUser, key: "id" },
    },
    passedIds: { type: DataTypes.JSONB, allowNull: true },
  },
  {
    sequelize: database,
    tableName: "PhaseState",
    timestamps: true,
  },
);

export default PhaseState;
