import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { StatusCodes } from "../../configurations/statusCodes";
import { VoteTier } from "../../admin/voting-content/VoteTier";

const getPricingService = errorUtilities.withServiceErrorHandling(async () => {
  const tiers = await VoteTier.findAll({ order: [["votes", "ASC"]] });
  return responseUtilities.handleServicesResponse(StatusCodes.OK, "Pricing fetched", tiers);
});

export default getPricingService;
