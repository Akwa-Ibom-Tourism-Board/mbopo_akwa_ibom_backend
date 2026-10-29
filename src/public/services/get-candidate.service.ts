import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { StatusCodes } from "../../configurations/statusCodes";
import { User } from "../../auth/User";
import { Application, ApplicationStatus } from "../../applicants/application/Application";
import { isPubliclyVisible, serializeCandidateForPublic } from "../helpers/public-candidate.helpers";

const getCandidateService = errorUtilities.withServiceErrorHandling(async (candidateId: string) => {
  const application = await Application.findByPk(candidateId);
  if (
    !application ||
    application.get("status") !== ApplicationStatus.Submitted ||
    !isPubliclyVisible(application)
  ) {
    throw errorUtilities.createError("Candidate not found", StatusCodes.NOT_FOUND);
  }

  const user = await User.findByPk(application.get("applicantId") as string);
  if (!user) {
    throw errorUtilities.createError("Candidate not found", StatusCodes.NOT_FOUND);
  }

  return responseUtilities.handleServicesResponse(
    StatusCodes.OK,
    "Candidate fetched",
    serializeCandidateForPublic(user, application),
  );
});

export default getCandidateService;
