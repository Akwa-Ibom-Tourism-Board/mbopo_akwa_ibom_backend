import { database } from "./database";
import "../auth/User";
import "../applicants/application/Application";

export async function syncDatabases() {
  console.log("📥 Registering models...");

  console.log("🔄 Syncing databases...");
  await database.sync(
    process.env.NODE_ENV === "development" ? { alter: true } : {},
  );
  console.log("✅ All databases synced successfully");
}
