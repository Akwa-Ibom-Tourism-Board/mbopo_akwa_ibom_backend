import { DataTypes, Model } from "sequelize";
import { database } from "../../configurations/database";
import { AdminUser } from "../users/AdminUser";
import { Application } from "../../applicants/application/Application";

export enum JudgeScoreStatus {
  Draft = "draft",
  Submitted = "submitted",
}

export interface JudgeScoreAttributes {
  id: string;
  judgeId: string;
  applicationId: string;
  roundId: string;
  // Criterion name -> 1..10. See SCORE_MIN/SCORE_MAX in
  // admin/judging/stages.config.ts.
  values: Record<string, number>;
  status: JudgeScoreStatus;
  question?: string | null;
  cause?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class JudgeScore extends Model<JudgeScoreAttributes> {}

JudgeScore.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },
    judgeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: AdminUser, key: "id" },
    },
    applicationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: Application, key: "id" },
    },
    roundId: { type: DataTypes.STRING(16), allowNull: false },
    values: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    status: {
      type: DataTypes.ENUM(...Object.values(JudgeScoreStatus)),
      allowNull: false,
      defaultValue: JudgeScoreStatus.Draft,
    },
    question: { type: DataTypes.TEXT, allowNull: true },
    cause: { type: DataTypes.STRING(100), allowNull: true },
  },
  {
    sequelize: database,
    tableName: "JudgeScore",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["judgeId", "applicationId", "roundId"],
        name: "JudgeScore_judge_application_round_key",
      },
    ],
  },
);

export default JudgeScore;
