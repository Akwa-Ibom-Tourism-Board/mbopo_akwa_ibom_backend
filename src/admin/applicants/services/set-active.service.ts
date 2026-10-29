import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { User } from "../../../auth/User";
import { Application } from "../../../applicants/application/Application";
import { serializeApplicant } from "../../helpers/applicant.helpers";

const setApplicantActiveService = errorUtilities.withServiceErrorHandling(
  async (userId: string, active: boolean) => {
    const user = await User.findByPk(userId);
    if (!user) {
      throw errorUtilities.createError("Applicant not found", StatusCodes.NOT_FOUND);
    }

    // Disabling also revokes any live session immediately — mirrors how
    // deactivating a staff AdminUser works (see admin/users).
    await user.update({ active, refreshToken: active ? user.get("refreshToken") : null } as any);

    const application = await Application.findOne({ where: { applicantId: userId } });

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      active ? "Applicant reactivated" : "Applicant disabled",
      serializeApplicant(user, application),
    );
  },
);

export default setApplicantActiveService;
