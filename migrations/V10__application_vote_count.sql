-- Additive and idempotent. `database.sync()` only alters tables in
-- development, so run this by hand against production before deploying.
-- Public voting (Stage 6) — credited only via POST /public/votes, and only
-- while an Application's stage is "grand_finale".

ALTER TABLE "Application"
  ADD COLUMN IF NOT EXISTS "voteCount" INTEGER NOT NULL DEFAULT 0;
