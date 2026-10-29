import { Op } from "sequelize";
import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { StatusCodes } from "../../configurations/statusCodes";
import { User } from "../../auth/User";
import { Application, ApplicationStatus, CandidateStage } from "../../applicants/application/Application";
import { AKWA_IBOM_LGAS } from "../../configurations/constants";
import { isPubliclyVisible, serializeCandidateForPublic } from "../helpers/public-candidate.helpers";

export interface PublicCandidateListQuery {
  lga?: string;
}

// Unauthenticated. No pagination: the public candidate pool is small
// (bounded by the pageant's own per-LGA/per-stage quotas), unlike the
// admin-side Applicants/Contestants lists.
const listCandidatesService = errorUtilities.withServiceErrorHandling(
  async (query: PublicCandidateListQuery) => {
    const where: any = {
      status: ApplicationStatus.Submitted,
      stage: { [Op.in]: [CandidateStage.SenatorialSelection, CandidateStage.GrandFinale] },
    };
    if (query.lga?.trim() && (AKWA_IBOM_LGAS as readonly string[]).includes(query.lga.trim())) {
      where.localGovernment = query.lga.trim();
    }

    const applications = await Application.findAll({ where, order: [["voteCount", "DESC"]] });
    const visible = applications.filter(isPubliclyVisible);

    const applicantIds = visible.map((application) => application.get("applicantId") as string);
    const users = await User.findAll({ where: { id: { [Op.in]: applicantIds } } });
    const userById = new Map(users.map((user) => [user.get("id") as string, user]));

    const candidates = visible
      .map((application) => {
        const user = userById.get(application.get("applicantId") as string);
        return user ? serializeCandidateForPublic(user, application) : null;
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Candidates fetched", {
      candidates,
    });
  },
);

export default listCandidatesService;
