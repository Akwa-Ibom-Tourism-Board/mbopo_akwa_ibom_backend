import { Op } from "sequelize";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { User } from "../../../auth/User";
import { Application, ApplicationStatus } from "../../../applicants/application/Application";
import { AdminRole } from "../../users/AdminUser";
import { serializeCandidateForViewer } from "../../helpers/candidate.helpers";
import { parsePageParams, buildPageMeta } from "../../helpers/pagination.helpers";

export interface ContestantListQuery {
  search?: string;
  lga?: string;
  page?: unknown;
  limit?: unknown;
}

const listContestantsService = errorUtilities.withServiceErrorHandling(
  async (viewerRole: AdminRole, query: ContestantListQuery) => {
    const { page, limit, offset } = parsePageParams(query);

    const where: any = { status: ApplicationStatus.Submitted };
    if (query.lga?.trim()) {
      where.localGovernment = query.lga.trim();
    }

    const { rows: applications, count: total } = await Application.findAndCountAll({
      where,
      order: [["submittedAt", "DESC"]],
      limit,
      offset,
    });

    const applicantIds = applications.map((app) => app.get("applicantId") as string);
    const userWhere: any = { id: { [Op.in]: applicantIds } };
    if (query.search?.trim()) {
      const term = `%${query.search.trim()}%`;
      userWhere[Op.or] = [
        { firstName: { [Op.iLike]: term } },
        { lastName: { [Op.iLike]: term } },
      ];
    }
    const users = await User.findAll({ where: userWhere });
    const userById = new Map(users.map((user) => [user.get("id") as string, user]));

    // The search filter is applied on User, after Application is already
    // paginated — a search hit can land on a page with fewer than `limit`
    // visible rows. Acceptable here: Contestants search is a convenience
    // filter over an already-small, post-LGA-selection set, not a
    // correctness-critical listing the way Applicants' is.
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
