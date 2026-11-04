import { syncZohoMail } from "../messages/services/zoho-mail-sync.service";
import { isZohoMailConfigured } from "./zoho-mail";

// Same shape as scheduleRetention() in maintenance.ts: a plain setInterval,
// safe to run on every pm2 instance at once (the Message/ComplainantReply
// zohoMessageId unique constraints are what actually prevent double-saving
// a given email, not single-instance scheduling).
const POLL_INTERVAL_MS = 2 * 60 * 1000;
const FIRST_RUN_DELAY_MS = 60 * 1000;

export const scheduleZohoMailSync = (): void => {
  if (!isZohoMailConfigured()) {
    console.log("ℹ️ Zoho Mail sync disabled (ZOHO_* env vars not set)");
    return;
  }

  const run = () => syncZohoMail().catch((error) => console.error("Zoho mail sync failed:", error.message));
  setTimeout(run, FIRST_RUN_DELAY_MS).unref();
  setInterval(run, POLL_INTERVAL_MS).unref();
  console.log(`📨 Zoho Mail sync scheduled every ${POLL_INTERVAL_MS / 1000}s`);
};

export default scheduleZohoMailSync;
