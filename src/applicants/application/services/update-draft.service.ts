import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { database } from "../../../configurations/database";
import { assertDraft, findApplicationForUpdate, normalizeDraftPayload } from "../application.helpers";

const updateDraftService = errorUtilities.withServiceErrorHandling(
  async (applicantId: string, payload: Record<string, any>) => {
    const application = await database.transaction(async (transaction) => {
      const locked = await findApplicationForUpdate(applicantId, transaction);

      if (!locked) {
        throw errorUtilities.createError(
          "No draft application found",
          StatusCodes.NOT_FOUND,
        );
      }

      assertDraft(locked);
      await locked.update(normalizeDraftPayload(payload), { transaction });
      return locked;
    });

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Draft updated",
      application,
    );
  },
);

export default updateDraftService;
