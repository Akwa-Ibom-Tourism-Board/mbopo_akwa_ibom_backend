import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { getOrCreateRegistrationSetting } from "../../../registration/registration.helpers";
import { RegistrationStatus } from "../../../registration/RegistrationSetting";
import { recordActivity } from "../../helpers/activity.helpers";

const LABELS: Record<RegistrationStatus, string> = {
  [RegistrationStatus.Open]: "open",
  [RegistrationStatus.NewIntakeClosed]: "closed to new intakes (existing applicants can continue)",
  [RegistrationStatus.Closed]: "fully closed",
};

const updateRegistrationStatusService = errorUtilities.withServiceErrorHandling(
  async (actorId: string, status: RegistrationStatus) => {
    const row = await getOrCreateRegistrationSetting();
    const previous = row.get("status") as RegistrationStatus;

    if (previous === status) {
      return responseUtilities.handleServicesResponse(StatusCodes.OK, "Registration status unchanged", {
        status,
      });
    }

    await row.update({ status, updatedBy: actorId } as any);

    await recordActivity(
      actorId,
      "settings",
      `Changed registration from ${LABELS[previous]} to ${LABELS[status]}`,
    );

    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Registration status updated", {
      status,
    });
  },
);

export default updateRegistrationStatusService;
