import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { Application } from "../Application";

const getMineService = errorUtilities.withServiceErrorHandling(
  async (applicantId: string) => {
    const application = await Application.findOne({ where: { applicantId } });

    if (!application) {
      throw errorUtilities.createError(
        "No application found",
        StatusCodes.NOT_FOUND,
      );
    }

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Application fetched",
      application,
    );
  },
);

export default getMineService;
