import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { database } from "../../../configurations/database";
import { VoteTier } from "../VoteTier";
import { recordActivity } from "../../helpers/activity.helpers";

export interface TierInput {
  votes: number;
  priceNaira: number;
}

// Replaces the whole list as one unit, like the admin frontend's editor
// saves it — simplest correct option for a short, admin-maintained list
// that's never edited concurrently by two people.
const saveTiersService = errorUtilities.withServiceErrorHandling(
  async (actorId: string, tiers: TierInput[]) => {
    if (new Set(tiers.map((t) => t.votes)).size !== tiers.length) {
      throw errorUtilities.createError(
        "Tiers must have unique vote counts",
        StatusCodes.BAD_REQUEST,
      );
    }

    const saved = await database.transaction(async (transaction) => {
      await VoteTier.destroy({ where: {}, transaction });
      return VoteTier.bulkCreate(tiers as any, { transaction });
    });

    await recordActivity(actorId, "voting", "Updated vote pricing");

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Vote pricing updated",
      [...saved].sort((a, b) => (a.get("votes") as number) - (b.get("votes") as number)),
    );
  },
);

export default saveTiersService;
