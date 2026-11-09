import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { User } from "../../../auth/User";
import { Application, ApplicationStatus } from "../../../applicants/application/Application";
import { AdminRole } from "../../users/AdminUser";
import { serializeCandidateForViewer } from "../../helpers/candidate.helpers";

// Roles who may open someone who hasn't finished registering (or hasn't
// started an application at all). An allow-list, not a deny-list of
// Judge/Media, so a future role defaults to restricted rather than
// accidentally gaining access to applicant drafts.
const CAN_VIEW_UNSUBMITTED: readonly AdminRole[] = [
  AdminRole.SuperAdmin,
  AdminRole.Admin,
  AdminRole.CustomerService,
];

// Backs the unified Participants detail page — one route for the
// Candidates/Applicants/Contestants tabs alike, keyed by the User's own id
// (not the Application's — a bare Candidate may not have one yet). Field
// redaction by tier still happens inside serializeCandidateForViewer; this
// only decides whether the viewer may see *this particular* record at all.
const getParticipantService = errorUtilities.withServiceErrorHandling(
  async (viewerRole: AdminRole, userId: string) => {
    const user = await User.findByPk(userId);
    if (!user) {
      throw errorUtilities.createError("Participant not found", StatusCodes.NOT_FOUND);
    }

    const application = await Application.findOne({ where: { applicantId: userId } });
    const isSubmitted = application?.get("status") === ApplicationStatus.Submitted;

    if (!isSubmitted && !CAN_VIEW_UNSUBMITTED.includes(viewerRole)) {
      throw errorUtilities.createError("Participant not found", StatusCodes.NOT_FOUND);
    }

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Participant fetched",
      serializeCandidateForViewer(user, application, viewerRole),
    );
  },
);

export default getParticipantService;
