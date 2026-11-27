import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import exportUnverifiedVinService from "../services/export-unverified-vin.service";

const exportUnverifiedVin = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    await exportUnverifiedVinService(request.adminUser!.role, response);
  },
);

export default exportUnverifiedVin;
