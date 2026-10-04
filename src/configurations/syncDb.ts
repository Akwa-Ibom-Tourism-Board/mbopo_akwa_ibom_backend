import { database } from "./database";
import "../auth/User";
import "../applicants/application/Application";
import "../notifications/Notification";
import "../messages/Message";

export async function syncDatabases() {
  console.log("📥 Registering models...");

  console.log("🔄 Syncing databases...");
  // `alter: true` re-diffs every table on each boot and, on Postgres, can
  // pile up duplicate constraints/indexes. Opt-in only; use migrations/.
  await database.sync(
    process.env.DB_SYNC_ALTER === "true" ? { alter: true } : {},
  );
  console.log("✅ All databases synced successfully");
}
