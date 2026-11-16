import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { User } from "../../../auth/User";
import {
  Application,
  ApplicationStatus,
} from "../../../applicants/application/Application";
import { AdminRole } from "../../users/AdminUser";

const CAN_VIEW_COUNTS: readonly AdminRole[] = [
  AdminRole.SuperAdmin,
  AdminRole.Admin,
  AdminRole.CustomerService,
];

const getParticipantsCountsService = errorUtilities.withServiceErrorHandling(
  async (viewerRole: AdminRole) => {
    if (!CAN_VIEW_COUNTS.includes(viewerRole)) {
      throw errorUtilities.createError(
        "You do not have permission to view participant counts",
        StatusCodes.FORBIDDEN,
      );
    }

    const [participants, candidates, applicants] = await Promise.all([
      User.count(),
      Application.count({ where: { status: ApplicationStatus.Submitted } }),
      Application.count({ where: { status: ApplicationStatus.Draft } }),
    ]);

    const notStarted = Math.max(0, participants - candidates - applicants);

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Participant counts fetched",
      { participants, candidates, applicants, notStarted },
    );
  },
);

export default getParticipantsCountsService;
