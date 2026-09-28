import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { Application, ApplicationStatus } from "../Application";

const updateDraftService = errorUtilities.withServiceErrorHandling(
  async (applicantId: string, payload: Record<string, any>) => {
    const application = await Application.findOne({ where: { applicantId } });

    if (!application) {
      throw errorUtilities.createError(
        "No draft application found",
        StatusCodes.NOT_FOUND,
      );
    }

    if (application.get("status") !== ApplicationStatus.Draft) {
      throw errorUtilities.createError(
        "This application has already been submitted and can no longer be edited",
        StatusCodes.CONFLICT,
      );
    }

    await application.update(payload);

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Draft updated",
      application,
    );
  },
);

export default updateDraftService;
