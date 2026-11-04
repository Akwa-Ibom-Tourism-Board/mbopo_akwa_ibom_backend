/**
 * One-off backfill: re-applies stripQuotedReply() to ComplainantReply rows
 * (and any email-sourced Message rows) already saved before quote-stripping
 * existed, so old complaints stop showing the entire quoted email chain.
 * Safe to re-run — it's idempotent (stripping already-clean text is a
 * no-op).
 *
 * Usage: NODE_ENV=development npx ts-node src/scripts/clean-quoted-replies.ts
 */
import dotenv from "dotenv";
dotenv.config();

import { database } from "../configurations/database";
import { Message, MessageSource } from "../messages/Message";
import { ComplainantReply } from "../messages/ComplainantReply";
import { stripQuotedReply } from "../configurations/zoho-mail";

async function main() {
  await database.authenticate();

  const replies = await ComplainantReply.findAll();
  let repliesChanged = 0;
  for (const reply of replies) {
    const body = reply.get("body") as string;
    const cleaned = stripQuotedReply(body);
    if (cleaned !== body) {
      await reply.update({ body: cleaned } as any);
      repliesChanged += 1;
    }
  }

  const emailMessages = await Message.findAll({ where: { source: MessageSource.Email } });
  let messagesChanged = 0;
  for (const message of emailMessages) {
    const body = message.get("message") as string;
    const cleaned = stripQuotedReply(body);
    if (cleaned !== body) {
      await message.update({ message: cleaned } as any);
      messagesChanged += 1;
    }
  }

  console.log(
    `✅ Cleaned ${repliesChanged}/${replies.length} ComplainantReply rows and ${messagesChanged}/${emailMessages.length} email-sourced Message rows`,
  );
}

main()
  .catch((error) => {
    console.error("❌ Backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await database.close();
  });
