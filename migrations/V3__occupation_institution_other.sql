-- Additive and idempotent. `database.sync()` only alters tables in
-- development, so run this by hand against production before deploying.
-- The Occupation/Institution dropdowns (added after V2) each pair with a
-- free-text "Other" field, which had nowhere to land on this side — every
-- custom entry was being silently dropped by validate()'s stripUnknown.
ALTER TABLE "Application"
  ADD COLUMN IF NOT EXISTS "occupationOther" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "institutionOther" VARCHAR(150);
