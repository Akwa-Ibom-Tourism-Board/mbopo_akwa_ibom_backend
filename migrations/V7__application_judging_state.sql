-- Additive and idempotent. `database.sync()` only alters tables in
-- development, so run this by hand against production before deploying.
-- Judging state for a submitted Application — stage/phase/candidateStatus
-- are null until submit.service.ts sets them (lga_selection/lga/active).
-- "candidateStatus" is its own column, not reusing "status", because
-- "status" already means draft/submitted — a different axis entirely.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Application_stage') THEN
    CREATE TYPE "enum_Application_stage" AS ENUM (
      'lga_selection', 'senatorial_selection', 'grand_finale'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Application_candidateStatus') THEN
    CREATE TYPE "enum_Application_candidateStatus" AS ENUM (
      'active', 'advanced', 'eliminated', 'disqualified', 'winner'
    );
  END IF;
END$$;

ALTER TABLE "Application"
  ADD COLUMN IF NOT EXISTS "stage" "enum_Application_stage",
  ADD COLUMN IF NOT EXISTS "phase" VARCHAR(16),
  ADD COLUMN IF NOT EXISTS "candidateStatus" "enum_Application_candidateStatus",
  ADD COLUMN IF NOT EXISTS "disqualificationReason" TEXT,
  ADD COLUMN IF NOT EXISTS "eliminatedAtPhase" VARCHAR(16),
  ADD COLUMN IF NOT EXISTS "disqualifiedAtPhase" VARCHAR(16);
