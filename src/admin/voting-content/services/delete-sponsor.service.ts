import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { Sponsor } from "../Sponsor";
import { recordActivity } from "../../helpers/activity.helpers";

const deleteSponsorService = errorUtilities.withServiceErrorHandling(
  async (actorId: string, id: string) => {
    const sponsor = await Sponsor.findByPk(id);
    if (!sponsor) {
      throw errorUtilities.createError("Sponsor not found", StatusCodes.NOT_FOUND);
    }
    const name = sponsor.get("name");
    await sponsor.destroy();
    await recordActivity(actorId, "voting", `Deleted sponsor ${name}`);
    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Sponsor deleted");
  },
);

export default deleteSponsorService;
