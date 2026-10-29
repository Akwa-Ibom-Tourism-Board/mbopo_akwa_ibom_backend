import { Op } from "sequelize";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { JudgeScore } from "../JudgeScore";
import { roundsOf } from "../stages.config";
import type { PhaseId } from "../phases.config";

export interface MyScoresFilter {
  applicationId?: string;
  phase?: PhaseId;
}

const getMyScoresService = errorUtilities.withServiceErrorHandling(
  async (judgeId: string, filter: MyScoresFilter) => {
    const where: any = { judgeId };
    if (filter.applicationId) where.applicationId = filter.applicationId;
    if (filter.phase) {
      where.roundId = { [Op.in]: roundsOf(filter.phase).map((r) => r.id) };
    }

    const scores = await JudgeScore.findAll({ where });

    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Scores fetched", scores);
  },
);

export default getMyScoresService;
