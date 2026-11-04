// Manual one-off run of the Zoho Mail sync, for testing the live API
// against the real credentials in .env before trusting the scheduled job.
// Usage: npm run zoho:sync-once
import { database } from "../configurations/database";
import "../messages/Message";
import "../messages/ComplainantReply";
import { syncZohoMail } from "../messages/services/zoho-mail-sync.service";

(async () => {
  try {
    const result = await syncZohoMail();
    console.log("Zoho mail sync result:", result);
  } catch (error: any) {
    console.error("Zoho mail sync failed:", error.response?.data ?? error.message);
  } finally {
    await database.close();
  }
})();
