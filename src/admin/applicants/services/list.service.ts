import { Op } from "sequelize";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { User } from "../../../auth/User";
import { Application, ApplicationStatus } from "../../../applicants/application/Application";
import { serializeApplicant } from "../../helpers/applicant.helpers";
import { parsePageParams, buildPageMeta } from "../../helpers/pagination.helpers";

export interface ApplicantListQuery {
  search?: string;
  status?: "not_started" | "in_progress" | "submitted";
  page?: unknown;
  limit?: unknown;
}

// No Sequelize associations are defined anywhere in this codebase (every
// other feature joins manually) — matching that convention rather than
// introducing `include` here. The status filter resolves to a plain set of
// applicantIds first, so pagination on User still stays correct.
const applicantIdsForStatus = async (
  status: ApplicantListQuery["status"],
): Promise<string[] | null> => {
  if (!status) return null;

  if (status === "not_started") {
    const started = await Application.findAll({ attributes: ["applicantId"] });
    const startedIds = new Set(started.map((row) => row.get("applicantId") as string));
    const allUsers = await User.findAll({ attributes: ["id"] });
    return allUsers.map((u) => u.get("id") as string).filter((id) => !startedIds.has(id));
  }

  const applicationStatus =
    status === "submitted" ? ApplicationStatus.Submitted : ApplicationStatus.Draft;
  const rows = await Application.findAll({
    where: { status: applicationStatus },
    attributes: ["applicantId"],
  });
  return rows.map((row) => row.get("applicantId") as string);
};

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
      where: { applicantId: { [Op.in]: users.map((u) => u.get("id") as string) } },
    });
    const applicationByApplicantId = new Map(
      applications.map((app) => [app.get("applicantId") as string, app]),
    );

    const data = users.map((user) =>
      serializeApplicant(user, applicationByApplicantId.get(user.get("id") as string) ?? null),
    );

    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Applicants fetched", {
      applicants: data,
      meta: buildPageMeta(page, limit, total),
    });
  },
);

export default listApplicantsService;
