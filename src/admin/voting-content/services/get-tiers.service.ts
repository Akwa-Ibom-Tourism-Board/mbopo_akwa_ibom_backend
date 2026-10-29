import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { VoteTier } from "../VoteTier";

const getTiersService = errorUtilities.withServiceErrorHandling(async () => {
  const tiers = await VoteTier.findAll({ order: [["votes", "ASC"]] });
  return responseUtilities.handleServicesResponse(StatusCodes.OK, "Vote tiers fetched", tiers);
});

export default getTiersService;
