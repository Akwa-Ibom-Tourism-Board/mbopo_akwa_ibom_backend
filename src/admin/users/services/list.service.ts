import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { AdminUser } from "../AdminUser";
import { serializeAdminUser } from "../../helpers/admin-auth.helpers";

const listAdminUsersService = errorUtilities.withServiceErrorHandling(async () => {
  const admins = await AdminUser.findAll({ order: [["createdAt", "ASC"]] });

  return responseUtilities.handleServicesResponse(
    StatusCodes.OK,
    "Admin users fetched",
    admins.map(serializeAdminUser),
  );
});

export default listAdminUsersService;
