import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { Application } from "../Application";

const getDraftService = errorUtilities.withServiceErrorHandling(
  async (applicantId: string) => {
    const application = await Application.findOne({ where: { applicantId } });

    if (!application) {
      throw errorUtilities.createError(
        "No draft application found",
        StatusCodes.NOT_FOUND,
      );
    }

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Draft fetched",
      application,
    );
  },
);

export default getDraftService;
