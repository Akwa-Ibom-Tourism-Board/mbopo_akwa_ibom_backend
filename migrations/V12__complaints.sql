-- Additive and idempotent. `database.sync()` only alters tables in
-- development, so run this by hand against production before deploying.
-- Admin-side complaints workflow over the existing public "Message" inbox.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Message_status') THEN
    CREATE TYPE "enum_Message_status" AS ENUM ('open', 'in_progress', 'resolved');
  END IF;
END$$;

ALTER TABLE "Message"
  ADD COLUMN IF NOT EXISTS "status" "enum_Message_status" NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS "assignedToId" UUID REFERENCES "AdminUser"("id");

CREATE TABLE IF NOT EXISTS "MessageReply" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "messageId" UUID NOT NULL REFERENCES "Message"("id"),
  "staffId" UUID NOT NULL REFERENCES "AdminUser"("id"),
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "MessageReply_messageId_idx" ON "MessageReply" ("messageId");
