-- Additive and idempotent. `database.sync()` only alters tables in
-- development, so run this by hand against production before deploying.
-- Lets Super Admin/Admin disable an applicant's account from the new
-- Applicants admin view, without deleting it. See authenticate.ts and
-- auth/services/login.service.ts for where this is enforced.
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
