/**
 * The ONLY way a Super Admin account ever gets created — never through any
 * API. Run by hand, once, against whichever database NODE_ENV points at:
 *
 *   SEED_SUPER_ADMIN_EMAIL=you@example.com \
 *   SEED_SUPER_ADMIN_PASSWORD='a strong password' \
 *   SEED_SUPER_ADMIN_FIRST_NAME=Jane \
 *   SEED_SUPER_ADMIN_LAST_NAME=Doe \
 *   npm run seed:super-admin
 *
 * Idempotent: re-running with the same email updates that row's name/
 * password/role rather than failing on the unique constraint, so this is
 * also how you reset a locked-out Super Admin's password.
 */
import dotenv from "dotenv";
dotenv.config();

import { database } from "../configurations/database";
import { AdminUser, AdminRole } from "../admin/users/AdminUser";
import { hashData } from "../auth/auth.helpers";

async function main() {
  const email = process.env.SEED_SUPER_ADMIN_EMAIL;
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;
  const firstName = process.env.SEED_SUPER_ADMIN_FIRST_NAME;
  const lastName = process.env.SEED_SUPER_ADMIN_LAST_NAME;

  const missing = Object.entries({
    SEED_SUPER_ADMIN_EMAIL: email,
    SEED_SUPER_ADMIN_PASSWORD: password,
    SEED_SUPER_ADMIN_FIRST_NAME: firstName,
    SEED_SUPER_ADMIN_LAST_NAME: lastName,
  })
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.error(`❌ Missing required env var(s): ${missing.join(", ")}`);
    console.error("See the comment at the top of this script for usage.");
    process.exitCode = 1;
    return;
  }

  if (password!.length < 8) {
    console.error("❌ SEED_SUPER_ADMIN_PASSWORD must be at least 8 characters");
    process.exitCode = 1;
    return;
  }

  await database.authenticate();

  const passwordHash = await hashData(password!);
  const normalizedEmail = email!.trim().toLowerCase();

  const [admin, created] = await AdminUser.findOrCreate({
    where: { email: normalizedEmail },
    defaults: {
      firstName: firstName!,
      lastName: lastName!,
      email: normalizedEmail,
      passwordHash,
      role: AdminRole.SuperAdmin,
      active: true,
    } as any,
  });

  if (!created) {
    await admin.update({
      firstName,
      lastName,
      passwordHash,
      role: AdminRole.SuperAdmin,
      active: true,
      passwordChangedAt: new Date(),
      refreshToken: null,
    } as any);
  }

  console.log(
    `✅ Super Admin ${created ? "created" : "updated"}: ${admin.get("email")} (id: ${admin.get("id")})`,
  );
}

main()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await database.close();
  });
