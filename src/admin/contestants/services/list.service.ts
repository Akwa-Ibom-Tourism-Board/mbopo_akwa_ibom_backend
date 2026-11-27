import { Op } from "sequelize";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { User } from "../../../auth/User";
import { Application, ApplicationStatus } from "../../../applicants/application/Application";
import { AdminRole } from "../../users/AdminUser";
import { serializeCandidateForViewer } from "../../helpers/candidate.helpers";
import { parsePageParams, buildPageMeta } from "../../helpers/pagination.helpers";
import { SENATORIAL_DISTRICTS } from "../../../configurations/constants";

export interface ContestantListQuery {
  search?: string;
  lga?: string;
  district?: string;
  phase?: string;
  candidateStatus?: string;
  page?: unknown;
  limit?: unknown;
}

const listContestantsService = errorUtilities.withServiceErrorHandling(
  async (viewerRole: AdminRole, query: ContestantListQuery) => {
    const { page, limit, offset } = parsePageParams(query);

    const where: any = { status: ApplicationStatus.Submitted };
    // Mutually exclusive in the UI (one dropdown or the other) — LGA wins if
    // somehow both are sent, being the more specific of the two.
    if (query.lga?.trim()) {
      where.localGovernment = query.lga.trim();
    } else if (query.district?.trim()) {
      where.localGovernment = { [Op.in]: SENATORIAL_DISTRICTS[query.district.trim()] ?? [] };
    }
    if (query.phase?.trim()) {
      where.phase = query.phase.trim();
    }
    if (query.candidateStatus?.trim()) {
      where.candidateStatus = query.candidateStatus.trim();
    }

    // Resolve a search term to matching User ids *before* paginating, so a
    // match outside the current page still surfaces — searching a name/email
    // against only whatever page was already fetched (by submittedAt, not by
    // relevance) would silently hide real matches on other pages.
    if (query.search?.trim()) {
      const term = `%${query.search.trim()}%`;
      const matchingUsers = await User.findAll({
        where: {
          [Op.or]: [
            { firstName: { [Op.iLike]: term } },
            { lastName: { [Op.iLike]: term } },
            { email: { [Op.iLike]: term } },
          ],
        },
        attributes: ["id"],
      });
      where.applicantId = { [Op.in]: matchingUsers.map((u) => u.get("id")) };
    }

    const { rows: applications, count: total } = await Application.findAndCountAll({
      where,
      order: [["submittedAt", "DESC"]],
      limit,
      offset,
    });

    const applicantIds = applications.map((app) => app.get("applicantId") as string);
    const users = await User.findAll({ where: { id: { [Op.in]: applicantIds } } });
    const userById = new Map(users.map((user) => [user.get("id") as string, user]));

    const data = applications
      .map((application) => {
        const user = userById.get(application.get("applicantId") as string);
        return user ? serializeCandidateForViewer(user, application, viewerRole) : null;
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Contestants fetched", {
      contestants: data,
      meta: buildPageMeta(page, limit, total),
    });
  },
);

export default listContestantsService;
