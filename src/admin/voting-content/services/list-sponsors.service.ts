import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { Sponsor } from "../Sponsor";

const listSponsorsService = errorUtilities.withServiceErrorHandling(async () => {
  const sponsors = await Sponsor.findAll({ order: [["createdAt", "ASC"]] });
  return responseUtilities.handleServicesResponse(StatusCodes.OK, "Sponsors fetched", sponsors);
});

export default listSponsorsService;
