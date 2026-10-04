import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { database } from "../../../configurations/database";
import { lockOrCreateDraft } from "../application.helpers";

const saveDraftService = errorUtilities.withServiceErrorHandling(
  async (applicantId: string, payload: Record<string, any>) => {
    // Create-or-update under a row lock: concurrent first saves collapse
    // onto one row (unique index + ON CONFLICT DO NOTHING) and all edits
    // serialize against submit.
    const { application, created } = await database.transaction(async (transaction) => {
      const result = await lockOrCreateDraft(applicantId, transaction);
      await result.application.update(payload, { transaction });
      return result;
    });

    return responseUtilities.handleServicesResponse(
      created ? StatusCodes.CREATED : StatusCodes.OK,
      created ? "Draft created" : "Draft saved",
      application,
    );
  },
);

export default saveDraftService;
