-- Additive and idempotent. `database.sync()` only alters tables in
-- development, so run this by hand against production before deploying.
-- Up to 3 file attachments (images/PDF, 5MB each — enforced client-side
-- and re-checked server-side) on a public complaint/message submission.

ALTER TABLE "Message"
  ADD COLUMN IF NOT EXISTS "attachments" JSONB NOT NULL DEFAULT '[]';
