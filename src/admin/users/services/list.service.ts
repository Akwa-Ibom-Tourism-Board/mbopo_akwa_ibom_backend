import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { AdminUser, AdminRole } from "../AdminUser";
import { serializeAdminUser } from "../../helpers/admin-auth.helpers";

// Super Admin accounts are invisible to anyone but a Super Admin viewer —
// not redacted, just not in the list at all. See assertTargetVisible's
// comment (admin/helpers/admin-users.helpers.ts) for why this is a filter
// here rather than a field-level redaction.
const listAdminUsersService = errorUtilities.withServiceErrorHandling(
  async (viewerRole: AdminRole) => {
    const admins = await AdminUser.findAll({ order: [["createdAt", "ASC"]] });
    const visible =
      viewerRole === AdminRole.SuperAdmin
        ? admins
        : admins.filter((admin) => (admin.get("role") as AdminRole) !== AdminRole.SuperAdmin);

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Admin users fetched",
      visible.map(serializeAdminUser),
    );
  },
);

export default listAdminUsersService;
