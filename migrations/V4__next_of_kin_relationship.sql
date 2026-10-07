-- Additive and idempotent. `database.sync()` only alters tables in
-- development, so run this by hand against production before deploying.
-- Applicants now also state how the next of kin is related to them.
ALTER TABLE "Application"
  ADD COLUMN IF NOT EXISTS "nextOfKinRelationship" VARCHAR(50);
