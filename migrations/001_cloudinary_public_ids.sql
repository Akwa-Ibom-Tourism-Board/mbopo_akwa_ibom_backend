-- Additive and idempotent. `database.sync()` only alters tables in
-- development, so run this by hand against production before deploying.
ALTER TABLE "Application"
  ADD COLUMN IF NOT EXISTS "passportPhotoPublicId" TEXT,
  ADD COLUMN IF NOT EXISTS "certificateOfOriginPublicId" TEXT,
  ADD COLUMN IF NOT EXISTS "fullImagePublicId" TEXT,
  ADD COLUMN IF NOT EXISTS "fullImagePublicId2" TEXT,
  ADD COLUMN IF NOT EXISTS "videoPitchPublicId" TEXT;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "avatarPublicId" TEXT;
