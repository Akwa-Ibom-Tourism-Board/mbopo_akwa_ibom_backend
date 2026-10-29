import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { Application } from "../../../applicants/application/Application";
import { JudgeScore, JudgeScoreStatus } from "../JudgeScore";
import { requireOpenPhase } from "../../helpers/phase-state.helpers";
import { inField } from "../../helpers/candidate-judging.helpers";
import { phaseOfRound } from "../stages.config";

export interface SaveScoreInput {
  applicationId: string;
  roundId: string;
  values: Record<string, number>;
  status: JudgeScoreStatus;
  question?: string;
  cause?: string;
}

// judgeId always comes from the authenticated caller (request.adminUser.id
// at the controller), never from the request body — a judge can't even
// attempt to save a score as someone else, unlike the frontend's dummy
// layer, which has to check this at runtime because the field is
// attacker-reachable there.
const saveScoreService = errorUtilities.withServiceErrorHandling(
  async (judgeId: string, input: SaveScoreInput) => {
    const phase = phaseOfRound(input.roundId);
    if (!phase) {
      throw errorUtilities.createError("Unknown round", StatusCodes.BAD_REQUEST);
    }
    await requireOpenPhase(phase);

    const application = await Application.findByPk(input.applicationId);
    if (!application || !inField(application, phase)) {
      throw errorUtilities.createError(
        "This candidate isn't competing in that stage",
        StatusCodes.BAD_REQUEST,
      );
    }

    const [score] = await JudgeScore.findOrCreate({
      where: { judgeId, applicationId: input.applicationId, roundId: input.roundId },
      defaults: {
        judgeId,
        applicationId: input.applicationId,
        roundId: input.roundId,
        values: input.values,
        status: input.status,
        question: input.question ?? null,
        cause: input.cause ?? null,
      } as any,
    });
    await score.update({
      values: input.values,
      status: input.status,
      question: input.question ?? null,
      cause: input.cause ?? null,
    } as any);

    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Score saved", score);
  },
);

export default saveScoreService;
