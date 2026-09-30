import { UniqueConstraintError } from "sequelize";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { User } from "../../../auth/User";
import { Application, ApplicationStatus } from "../Application";

const saveDraftService = errorUtilities.withServiceErrorHandling(
  async (applicantId: string, payload: Record<string, any>) => {
    const existing = await Application.findOne({ where: { applicantId } });

    if (!existing) {
      // Defense in depth — the dashboard gates this behind the NIN/VIN
      // identity check client-side, but a direct API call must be stopped
      // here too: no draft can exist for an applicant who hasn't verified.
      const applicant = await User.findByPk(applicantId);
      if (!applicant?.get("identityVerified")) {
        throw errorUtilities.createError(
          "Please verify your NIN and VIN before starting your application",
          StatusCodes.FORBIDDEN,
        );
      }

      let created;
      try {
        created = await Application.create({
          applicantId,
          ...payload,
          status: ApplicationStatus.Draft,
        } as any);
      } catch (error: any) {
        // Two near-simultaneous first-save calls could both see "no draft
        // yet" — the unique index on applicantId is the real guard here.
        if (error instanceof UniqueConstraintError) {
          const raceWinner = await Application.findOne({
            where: { applicantId },
          });
          if (raceWinner) {
            await raceWinner.update(payload);
            return responseUtilities.handleServicesResponse(
              StatusCodes.OK,
              "Draft saved",
              raceWinner,
            );
          }
        }
        throw error;
      }

      return responseUtilities.handleServicesResponse(
        StatusCodes.CREATED,
        "Draft created",
        created,
      );
    }

    if (existing.get("status") !== ApplicationStatus.Draft) {
      throw errorUtilities.createError(
        "This application has already been submitted and can no longer be edited",
        StatusCodes.CONFLICT,
      );
    }

    await existing.update(payload);

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Draft saved",
      existing,
    );
  },
);

export default saveDraftService;
