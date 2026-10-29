import { Request, Response } from "express";
import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import castVoteService from "../services/cast-vote.service";

const castVote = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await castVoteService(request.body.candidateId, request.body.votes);
    return responseUtilities.responseHandler(
      response,
      result.message,
      result.statusCode,
      result.data,
    );
  },
);

export default castVote;
