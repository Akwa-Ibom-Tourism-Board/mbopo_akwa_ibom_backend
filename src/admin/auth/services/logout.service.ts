import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { AdminUser } from "../../users/AdminUser";
import { recordActivity } from "../../helpers/activity.helpers";

const adminLogoutService = errorUtilities.withServiceErrorHandling(async (adminId: string) => {
  await AdminUser.update({ refreshToken: null }, { where: { id: adminId } });
  await recordActivity(adminId, "access", "Signed out");

  return responseUtilities.handleServicesResponse(StatusCodes.OK, "Logged out successfully");
});

export default adminLogoutService;
