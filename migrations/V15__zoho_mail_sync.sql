-- Additive and idempotent. `database.sync()` only alters tables in
-- development, so run this by hand against production before deploying.
-- Lets complaints originate from mail sent directly to info@akhtdc.com.ng
-- (fetched via the Zoho Mail API), not just the "Ask Me" widget, and lets a
-- complainant's own follow-up email thread onto their existing complaint.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Message_source') THEN
    CREATE TYPE "enum_Message_source" AS ENUM ('widget', 'email');
  END IF;
END$$;

ALTER TABLE "Message"
  ADD COLUMN IF NOT EXISTS "source" "enum_Message_source" NOT NULL DEFAULT 'widget',
  ADD COLUMN IF NOT EXISTS "zohoMessageId" VARCHAR(255);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Message_zohoMessageId_key'
  ) THEN
    ALTER TABLE "Message" ADD CONSTRAINT "Message_zohoMessageId_key" UNIQUE ("zohoMessageId");
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "ComplainantReply" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "messageId" UUID NOT NULL REFERENCES "Message"("id"),
  "body" TEXT NOT NULL,
  "attachments" JSONB NOT NULL DEFAULT '[]',
  "zohoMessageId" VARCHAR(255) NOT NULL UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ComplainantReply_messageId_idx" ON "ComplainantReply" ("messageId");
