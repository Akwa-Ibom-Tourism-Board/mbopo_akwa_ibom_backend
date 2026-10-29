import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { AdminUser } from "../../users/AdminUser";
import { serializeAdminUser } from "../../helpers/admin-auth.helpers";

const adminMeService = errorUtilities.withServiceErrorHandling(async (adminId: string) => {
  const admin = await AdminUser.findByPk(adminId);
  if (!admin) {
    throw errorUtilities.createError("Admin account not found", StatusCodes.NOT_FOUND);
  }

  return responseUtilities.handleServicesResponse(
    StatusCodes.OK,
    "Admin account fetched",
    serializeAdminUser(admin),
  );
});

export default adminMeService;
