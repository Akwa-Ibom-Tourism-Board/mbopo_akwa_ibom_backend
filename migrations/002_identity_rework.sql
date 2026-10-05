-- Additive and idempotent. `database.sync()` only alters tables in
-- development, so run this by hand against production before deploying.
-- Legacy columns ("ward", User."localGovernment", passportPhoto*) are
-- deliberately left in place and simply no longer written.
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "middleName" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "isVinVerified" BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS "vinVerificationFailedReason" TEXT;

ALTER TABLE "Application"
  ADD COLUMN IF NOT EXISTS "vin" VARCHAR(19),
  ADD COLUMN IF NOT EXISTS "localGovernment" VARCHAR(255);
