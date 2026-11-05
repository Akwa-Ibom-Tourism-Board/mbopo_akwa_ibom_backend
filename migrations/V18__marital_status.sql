-- Additive and idempotent. `database.sync()` only alters tables in
-- development, so run this by hand against production before deploying.
-- Applicant-selected marital status, collected on the Personal step of
-- registration. NULL for every existing applicant (registered before this
-- field existed) and for anyone who hasn't reached that step of a draft yet.

ALTER TABLE "Application"
  ADD COLUMN IF NOT EXISTS "maritalStatus" VARCHAR(20);
