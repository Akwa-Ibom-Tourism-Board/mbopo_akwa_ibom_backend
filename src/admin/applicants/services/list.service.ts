import { Op } from "sequelize";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { User } from "../../../auth/User";
import { Application } from "../../../applicants/application/Application";
import { serializeApplicant } from "../../helpers/applicant.helpers";
import {
  applicantIdsForStatus,
  type ApplicantFilterStatus,
} from "../../helpers/applicant-progress.helpers";
import {
  parsePageParams,
  buildPageMeta,
} from "../../helpers/pagination.helpers";

export interface ApplicantListQuery {
  search?: string;
  status?: ApplicantFilterStatus;
  page?: unknown;
  limit?: unknown;
}

const listApplicantsService = errorUtilities.withServiceErrorHandling(
  async (query: ApplicantListQuery) => {
    const { page, limit, offset } = parsePageParams(query);

    const where: any = {};
    if (query.search?.trim()) {
      const term = `%${query.search.trim()}%`;
      where[Op.or] = [
        { firstName: { [Op.iLike]: term } },
        { lastName: { [Op.iLike]: term } },
        { email: { [Op.iLike]: term } },
      ];
    }

    const matchingIds = await applicantIdsForStatus(query.status);
    if (matchingIds) {
      where.id = { [Op.in]: matchingIds };
    }

    const { rows: users, count: total } = await User.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    const applications = await Application.findAll({
      where: {
        applicantId: { [Op.in]: users.map((u) => u.get("id") as string) },
      },
    });
    const applicationByApplicantId = new Map(
      applications.map((app) => [app.get("applicantId") as string, app]),
    );

    const data = users.map((user) =>
      serializeApplicant(
        user,
        applicationByApplicantId.get(user.get("id") as string) ?? null,
      ),
    );

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Applicants fetched",
      {
        applicants: data,
        meta: buildPageMeta(page, limit, total),
      },
    );
  },
);

export default listApplicantsService;
