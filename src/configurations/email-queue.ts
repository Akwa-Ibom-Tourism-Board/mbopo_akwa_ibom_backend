import Queue from "bull";
import configurations from ".";
import { sendEmail, EmailPayload } from "./email-sender";

// Every email waits this long in the queue before it is sent.
const EMAIL_SEND_DELAY_MS = 5_000;

if (!configurations.REDIS_URL) {
  console.error("❌ REDIS_URL is not set — queued emails will never be delivered");
}

const emailQueue = new Queue("email queue", configurations.REDIS_URL!);

// Without these, a bad Redis URL fails silently and emails just vanish.
emailQueue.on("error", (error) => console.error("Email queue error:", error.message));
emailQueue.on("ready", () => console.log("📬 Email queue connected to Redis"));

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

emailQueue.process("sendEmail", async (job) => {
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
