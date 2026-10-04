import { QueryTypes } from "sequelize";
import { database } from "./database";

// Retention keeps the small free-tier database from filling with rows nobody
// will read again. Idempotent batched deletes, so running on several
// instances (or twice) is harmless. Runs once a day: one brief wake-up,
// not a keep-alive.
const DAY_MS = 24 * 60 * 60 * 1000;
const READ_NOTIFICATION_RETENTION_DAYS = 60;
const ANY_NOTIFICATION_RETENTION_DAYS = 180;
const UNVERIFIED_ACCOUNT_RETENTION_DAYS = 7;
const BATCH_SIZE = 1000;

const deleteBatch = async (sql: string): Promise<number> => {
  let total = 0;
  for (;;) {
    const rows = await database.query(sql, {
      type: QueryTypes.SELECT,
      replacements: { limit: BATCH_SIZE },
    });
    total += rows.length;
    if (rows.length < BATCH_SIZE) return total;
  }
};

export const runRetention = async (): Promise<void> => {
  const notifications = await deleteBatch(`
    WITH doomed AS (
      SELECT "id" FROM "Notification"
      WHERE ("read" = true AND "createdAt" < NOW() - INTERVAL '${READ_NOTIFICATION_RETENTION_DAYS} days')
         OR "createdAt" < NOW() - INTERVAL '${ANY_NOTIFICATION_RETENTION_DAYS} days'
      LIMIT :limit
    )
    DELETE FROM "Notification" WHERE "id" IN (SELECT "id" FROM doomed) RETURNING "id"`);

  // Abandoned sign-ups: never confirmed their email, so never got to the
  // identity step (and therefore have no Application).
  const users = await deleteBatch(`
    WITH doomed AS (
      SELECT u."id" FROM "User" u
      WHERE u."emailVerified" = false AND u."identityVerified" = false
        AND u."createdAt" < NOW() - INTERVAL '${UNVERIFIED_ACCOUNT_RETENTION_DAYS} days'
        AND NOT EXISTS (SELECT 1 FROM "Application" a WHERE a."applicantId" = u."id")
      LIMIT :limit
    ), gone AS (
      DELETE FROM "Notification" WHERE "userId" IN (SELECT "id" FROM doomed)
    )
    DELETE FROM "User" WHERE "id" IN (SELECT "id" FROM doomed) RETURNING "id"`);

  console.log(`🧹 Retention: purged ${notifications} notifications, ${users} unverified accounts`);
};

export const scheduleRetention = (): void => {
  const run = () => runRetention().catch((error) => console.error("Retention failed:", error.message));
  // Delay the first run so it never competes with boot-time work.
  setTimeout(run, 5 * 60 * 1000).unref();
  setInterval(run, DAY_MS).unref();
};
