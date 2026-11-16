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
import { recordActivity } from "../../helpers/activity.helpers";
import { sendAdminWelcomeEmail } from "../../helpers/auth-email.helpers";


const createAdminUsersBulkService = errorUtilities.withServiceErrorHandling(
  async (
    actorId: string,
    actorRole: AdminRole,
    inputs: NewAdminUserInput[],
  ) => {
    const created: (ReturnType<typeof serializeAdminUser> & {
      temporaryPassword: string;
      emailQueued: boolean;
    })[] = [];
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

        const emailQueued = await sendAdminWelcomeEmail({
          firstName: input.firstName,
          email: input.email,
          role: input.role,
          temporaryPassword,
        });

        created.push({
          ...serializeAdminUser(admin),
          temporaryPassword,
          emailQueued,
        } as any);
      } catch (error: any) {
        const reason =
          error instanceof UniqueConstraintError
            ? "Email already in use"
            : (error.message ?? "Could not create this user");
        failed.push({ email: input.email, reason });
      }
    }

    if (created.length) {
      await recordActivity(
        actorId,
        "users",
        `Added ${created.length} staff account(s) in bulk`,
      );
    }

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Bulk add complete",
      {
        created,
        failed,
      },
    );
  },
);

export default createAdminUsersBulkService;
