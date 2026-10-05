import Queue from "bull";
import configurations from ".";
import { sendEmail, warmUpEmailTransport, EmailPayload } from "./email-sender";

// Every email is enqueued immediately but not sent until this long after.
const EMAIL_SEND_DELAY_MS = 5_000;
// Several emails may be sent at once, so one slow send never holds the rest.
const EMAIL_WORKER_CONCURRENCY = 5;

if (!configurations.REDIS_URL) {
  console.error("❌ REDIS_URL is not set — queued emails will never be delivered");
}

const emailQueue = new Queue("email queue", configurations.REDIS_URL!, {
  settings: {
    // Bull promotes delayed jobs with a timer and falls back to polling at
    // this interval (default 5s). Polling every second keeps a "5 second"
    // delay from stretching to ~10s when the timer is missed.
    guardInterval: 1_000,
  },
});

// Without these, a bad Redis URL fails silently and emails just vanish.
emailQueue.on("error", (error) => console.error("Email queue error:", error.message));
emailQueue.on("ready", () => {
  console.log("📬 Email queue connected to Redis");
  // Open the SMTP connection now so the first email doesn't pay for the
  // TLS handshake and login on top of its delay.
  warmUpEmailTransport().catch((error) =>
    console.error("Email transport warm-up failed:", error.message),
  );
});

// Returns as soon as the job is handed to Redis — callers never wait for
// the delay or the send, and an enqueue failure is logged, not thrown, so it
// can't fail the request that triggered the email.
export const queueEmail = async (payload: EmailPayload): Promise<void> => {
  emailQueue
    .add("sendEmail", payload, {
      delay: EMAIL_SEND_DELAY_MS,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: true,
    })
    .then((job) => console.log(`Email job ${job.id} queued for ${payload.subject}`))
    .catch((error) => {
      console.error("Failed to add email to queue:", error);
    });
};

emailQueue.process("sendEmail", EMAIL_WORKER_CONCURRENCY, async (job) => {
  await sendEmail(job.data);
});

emailQueue.on("completed", (job) => {
  console.log(`Email job ${job.id} completed`);
});

emailQueue.on("failed", (job, err) => {
  console.error(`Email job ${job?.id} failed: ${err.message}`);
});

export default {
  queueEmail,
};
