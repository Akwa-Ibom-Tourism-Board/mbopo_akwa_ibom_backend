import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { User } from "../../../auth/User";
import { Application, ApplicationStatus } from "../../../applicants/application/Application";
import { AdminRole } from "../../users/AdminUser";
import { serializeCandidateForViewer } from "../../helpers/candidate.helpers";

const getContestantService = errorUtilities.withServiceErrorHandling(
  async (viewerRole: AdminRole, applicationId: string) => {
    const application = await Application.findByPk(applicationId);
    if (!application || application.get("status") !== ApplicationStatus.Submitted) {
      throw errorUtilities.createError("Contestant not found", StatusCodes.NOT_FOUND);
    }

    const user = await User.findByPk(application.get("applicantId") as string);
    if (!user) {
      throw errorUtilities.createError("Contestant not found", StatusCodes.NOT_FOUND);
    }

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Contestant fetched",
      serializeCandidateForViewer(user, application, viewerRole),
    );
  },
);

export default getContestantService;
