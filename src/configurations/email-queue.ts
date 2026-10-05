import Queue from "bull";
import configurations from ".";
import { sendEmail, EmailPayload } from "./email-sender";

// Every email waits this long in the queue before it is sent.
const EMAIL_SEND_DELAY_MS = 5_000;

const emailQueue = new Queue("email queue", configurations.REDIS_URL!);

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
