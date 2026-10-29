import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { database } from "../../../configurations/database";
import { User } from "../../../auth/User";
import { Application } from "../../../applicants/application/Application";
import { Notification } from "../../../notifications/Notification";

// No ON DELETE CASCADE on either FK (Application.applicantId,
// Notification.userId) — deliberately explicit here instead, inside one
// transaction, rather than a schema-level cascade that could delete more
// than intended from some future table nobody remembered to check.
const deleteApplicantService = errorUtilities.withServiceErrorHandling(
  async (userId: string) => {
    const user = await User.findByPk(userId);
    if (!user) {
      throw errorUtilities.createError("Applicant not found", StatusCodes.NOT_FOUND);
    }

    await database.transaction(async (transaction) => {
      await Application.destroy({ where: { applicantId: userId }, transaction });
      await Notification.destroy({ where: { userId }, transaction });
      await user.destroy({ transaction });
    });

    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Applicant deleted");
  },
);

export default deleteApplicantService;
