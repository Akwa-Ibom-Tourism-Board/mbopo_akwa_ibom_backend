import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { AdminUser } from "../../users/AdminUser";

const adminLogoutService = errorUtilities.withServiceErrorHandling(async (adminId: string) => {
  await AdminUser.update({ refreshToken: null }, { where: { id: adminId } });

  return responseUtilities.handleServicesResponse(StatusCodes.OK, "Logged out successfully");
});

export default adminLogoutService;
