import { UniqueConstraintError } from "sequelize";
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
} from "../../helpers/admin-users.helpers";

// Per-row try/catch so one bad email in a batch doesn't abort the rest —
// mirrors the admin frontend's own bulk-add dummy implementation.
const createAdminUsersBulkService = errorUtilities.withServiceErrorHandling(
  async (actorRole: AdminRole, inputs: NewAdminUserInput[]) => {
    const created: ReturnType<typeof serializeAdminUser>[] = [];
    const failed: { email: string; reason: string }[] = [];

    for (const input of inputs) {
      try {
        assertAssignable(actorRole, input.role);
        await assertSingleActiveHeadJudge(input.role, true);

        const temporaryPassword = generateTemporaryPassword();
        const admin = await AdminUser.create({
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          role: input.role,
          active: true,
          passwordHash: await hashData(temporaryPassword),
        } as any);

        created.push({ ...serializeAdminUser(admin), temporaryPassword } as any);
      } catch (error: any) {
        const reason =
          error instanceof UniqueConstraintError
            ? "Email already in use"
            : (error.message ?? "Could not create this user");
        failed.push({ email: input.email, reason });
      }
    }

    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Bulk add complete", {
      created,
      failed,
    });
  },
);

export default createAdminUsersBulkService;
