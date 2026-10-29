import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { User } from "../../../auth/User";
import { Application } from "../../../applicants/application/Application";
import { serializeApplicant } from "../../helpers/applicant.helpers";

const getApplicantService = errorUtilities.withServiceErrorHandling(async (userId: string) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw errorUtilities.createError("Applicant not found", StatusCodes.NOT_FOUND);
  }

  const application = await Application.findOne({ where: { applicantId: userId } });

  return responseUtilities.handleServicesResponse(
    StatusCodes.OK,
    "Applicant fetched",
    serializeApplicant(user, application),
  );
});

export default getApplicantService;
