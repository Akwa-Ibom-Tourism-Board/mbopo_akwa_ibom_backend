-- Additive and idempotent. `database.sync()` only alters tables in
-- development, so run this by hand against production before deploying.
-- Adds the free-text field paired with an "Other" option on the
-- registration form's "Highest educational qualification" dropdown,
-- mirroring institutionOther/occupationOther.

ALTER TABLE "Application"
  ADD COLUMN IF NOT EXISTS "educationOther" VARCHAR(100);
