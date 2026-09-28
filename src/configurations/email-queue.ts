import Queue from "bull";
import configurations from ".";
import { sendEmail } from "./email";

const emailQueue = new Queue("email queue", configurations.REDIS_URL!);

export const queueEmail = async (payload: {
  to: string;
  subject: string;
  htmlBody: string;
}): Promise<void> => {
  emailQueue
    .add("sendEmail", payload, {
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
