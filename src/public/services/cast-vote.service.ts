import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { StatusCodes } from "../../configurations/statusCodes";
import { Application, ApplicationStatus } from "../../applicants/application/Application";
import { isVotable } from "../helpers/public-candidate.helpers";

// Unauthenticated, and — deliberately, for now — unpaid: the voting
// platform still simulates its payment step (per the product decision for
// this stage of the build), so this endpoint has no real payment
// verification behind it. Anyone who can call it can credit free votes.
// That's an accepted gap while payment stays simulated on the frontend,
// not an oversight — flagging it here so it isn't later mistaken for a
// finished, production-safe path. Real payment verification is a
// prerequisite before this goes live for real money.
const castVoteService = errorUtilities.withServiceErrorHandling(
  async (candidateId: string, votes: number) => {
    const application = await Application.findByPk(candidateId);
    if (!application || application.get("status") !== ApplicationStatus.Submitted) {
      throw errorUtilities.createError("Candidate not found", StatusCodes.NOT_FOUND);
    }

    if (!isVotable(application)) {
      throw errorUtilities.createError(
        "Voting is not open for this candidate yet",
        StatusCodes.BAD_REQUEST,
      );
    }

    await application.increment("voteCount", { by: votes });
    await application.reload();

    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Vote recorded", {
      candidateId,
      voteCount: application.get("voteCount"),
    });
  },
);

export default castVoteService;
