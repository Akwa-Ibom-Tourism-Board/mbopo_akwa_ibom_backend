import { fn, col } from "sequelize";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import {
  Application,
  ApplicationStatus,
  CandidateJudgingStatus,
} from "../../../applicants/application/Application";
import { AdminRole } from "../../users/AdminUser";

// Dashboard aggregates (counts, sums, group-bys) computed in SQL rather than
// by fetching every contestant row into the client to add up — the same
// reasoning behind paginating the Contestants list itself: these numbers
// must stay correct, and cheap, no matter how many contestants there end up
// being.
const statsService = errorUtilities.withServiceErrorHandling(
  async (_viewerRole: AdminRole) => {
    const where = { status: ApplicationStatus.Submitted };

    const [total, active, withoutBio, votesRow, lgaRows] = await Promise.all([
      Application.count({ where }),
      Application.count({
        where: { ...where, candidateStatus: CandidateJudgingStatus.Active },
      }),
      Application.count({ where: { ...where, bio: null } }),
      Application.findOne({
        where,
        attributes: [[fn("COALESCE", fn("SUM", col("voteCount")), 0), "total"]],
        raw: true,
      }) as unknown as Promise<{ total: string } | null>,
      Application.findAll({
        where,
        attributes: ["localGovernment", [fn("COUNT", col("id")), "count"]],
        group: ["localGovernment"],
        raw: true,
      }) as unknown as Promise<{ localGovernment: string | null; count: string }[]>,
    ]);

    const byLga: Record<string, number> = {};
    for (const row of lgaRows) {
      if (row.localGovernment) byLga[row.localGovernment] = Number(row.count);
    }

    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Contestant stats fetched", {
      total,
      active,
      withoutBio,
      totalVotes: Number(votesRow?.total ?? 0),
      byLga,
    });
  },
);

export default statsService;
