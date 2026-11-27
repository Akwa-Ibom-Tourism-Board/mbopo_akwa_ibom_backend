import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import exportParticipantsService from "../services/export.service";

const exportParticipants = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    await exportParticipantsService(
      request.adminUser!.role,
      response,
      request.validatedQuery ?? {},
    );
  },
);

export default exportParticipants;
