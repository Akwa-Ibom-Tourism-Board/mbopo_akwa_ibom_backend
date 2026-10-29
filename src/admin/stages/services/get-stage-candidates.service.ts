import { Op } from "sequelize";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { User } from "../../../auth/User";
import { Application } from "../../../applicants/application/Application";
import { getJudgingPool, participantsOf } from "../../helpers/candidate-judging.helpers";
import { serializeCandidateForViewer } from "../../helpers/candidate.helpers";
import { AdminRole } from "../../users/AdminUser";
import type { PhaseId } from "../../judging/phases.config";

// The StagePage's data source: who appears on this stage's page, and how
// it went for them (competing/advanced/eliminated/disqualified/incoming).
const getStageCandidatesService = errorUtilities.withServiceErrorHandling(
  async (viewerRole: AdminRole, phase: PhaseId) => {
    const pool = await getJudgingPool();
    const participants = participantsOf(phase, pool);

    const applicantIds = participants.map((p) => p.application.get("applicantId") as string);
    const users = await User.findAll({ where: { id: { [Op.in]: applicantIds } } });
    const userByApplicantId = new Map(users.map((u) => [u.get("id") as string, u]));

    const data = participants
      .map(({ application, outcome }) => {
        const user = userByApplicantId.get(application.get("applicantId") as string);
        if (!user) return null;
        return {
          ...serializeCandidateForViewer(user, application as Application, viewerRole),
          outcome,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Stage candidates fetched", data);
  },
);

export default getStageCandidatesService;
