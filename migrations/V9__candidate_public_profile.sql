-- Additive and idempotent. `database.sync()` only alters tables in
-- development, so run this by hand against production before deploying.
-- Media-managed public profile content for a candidate (admin/contestants
-- Stage 4) — never written by the applicant's own registration flow.

ALTER TABLE "Application"
  ADD COLUMN IF NOT EXISTS "bio" TEXT,
  ADD COLUMN IF NOT EXISTS "additionalPhotos" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "additionalVideos" JSONB NOT NULL DEFAULT '[]';
