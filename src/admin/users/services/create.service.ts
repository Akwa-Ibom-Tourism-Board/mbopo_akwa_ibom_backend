import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { hashData } from "../../../auth/auth.helpers";
import { AdminUser, AdminRole } from "../AdminUser";
import { serializeAdminUser } from "../../helpers/admin-auth.helpers";
import {
  type NewAdminUserInput,
  generateTemporaryPassword,
  assertAssignable,
  assertSingleActiveHeadJudge,
  mapUniqueConstraintError,
} from "../../helpers/admin-users.helpers";

const createAdminUserService = errorUtilities.withServiceErrorHandling(
  async (actorRole: AdminRole, input: NewAdminUserInput) => {
    assertAssignable(actorRole, input.role);
    await assertSingleActiveHeadJudge(input.role, true);

    const temporaryPassword = generateTemporaryPassword();

    try {
      const admin = await AdminUser.create({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        role: input.role,
        active: true,
        passwordHash: await hashData(temporaryPassword),
      } as any);

      return responseUtilities.handleServicesResponse(StatusCodes.CREATED, "Admin user created", {
        ...serializeAdminUser(admin),
        temporaryPassword,
      });
    } catch (error) {
      mapUniqueConstraintError(error);
    }
  },
);

export default createAdminUserService;
