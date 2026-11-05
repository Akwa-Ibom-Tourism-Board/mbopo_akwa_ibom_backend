-- Additive and idempotent. `database.sync()` only alters tables in
-- development, so run this by hand against production before deploying.
-- Lets staff see whether a complaint reply's notification email actually
-- reached the complainant, not just that the reply itself was saved.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_MessageReply_emailStatus') THEN
    CREATE TYPE "enum_MessageReply_emailStatus" AS ENUM ('pending', 'sent', 'failed');
  END IF;
END$$;

ALTER TABLE "MessageReply"
  ADD COLUMN IF NOT EXISTS "emailStatus" "enum_MessageReply_emailStatus" NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS "emailError" TEXT,
  ADD COLUMN IF NOT EXISTS "emailSentAt" TIMESTAMPTZ;

-- Replies that already exist predate this tracking entirely — their email
-- either already went out (most of them) or it's moot to re-check now.
-- Mark them "sent" rather than leaving every historical reply stuck on
-- "pending" forever.
UPDATE "MessageReply" SET "emailStatus" = 'sent' WHERE "emailSentAt" IS NULL AND "createdAt" < now();
