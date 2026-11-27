import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { getOrCreateRegistrationSetting } from "../../../registration/registration.helpers";

const getRegistrationStatusService = errorUtilities.withServiceErrorHandling(async () => {
  const row = await getOrCreateRegistrationSetting();
  return responseUtilities.handleServicesResponse(StatusCodes.OK, "Registration status fetched", {
    status: row.get("status"),
    updatedAt: row.get("updatedAt"),
    updatedBy: row.get("updatedBy") ?? null,
  });
});

export default getRegistrationStatusService;
