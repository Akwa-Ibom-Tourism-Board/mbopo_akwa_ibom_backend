-- Additive and idempotent. `database.sync()` only alters tables in
-- development, so run this by hand against production before deploying.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_JudgeScore_status') THEN
    CREATE TYPE "enum_JudgeScore_status" AS ENUM ('draft', 'submitted');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_PhaseState_status') THEN
    CREATE TYPE "enum_PhaseState_status" AS ENUM ('pending', 'open', 'closed');
  END IF;
END$$;

-- One row per (judge, candidate, round) — upserted by save-score.service.ts,
-- never duplicated. "values" is criterion name -> 1..10.
CREATE TABLE IF NOT EXISTS "JudgeScore" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "judgeId" UUID NOT NULL REFERENCES "AdminUser"("id"),
  "applicationId" UUID NOT NULL REFERENCES "Application"("id"),
  "roundId" VARCHAR(16) NOT NULL,
  "values" JSONB NOT NULL DEFAULT '{}',
  "status" "enum_JudgeScore_status" NOT NULL DEFAULT 'draft',
  "question" TEXT,
  "cause" VARCHAR(100),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Checked against pg_indexes, not pg_constraint: the JudgeScore model
-- declares this uniqueness as a plain unique index (see JudgeScore.ts),
-- which database.sync() may have already created under this exact name
-- (e.g. on a Render deploy that booted before this migration ran by hand)
-- — a standalone unique index never shows up in pg_constraint, so that
-- check alone would miss it and collide on the constraint's own backing
-- index.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'JudgeScore_judge_application_round_key'
  ) THEN
    ALTER TABLE "JudgeScore" ADD CONSTRAINT "JudgeScore_judge_application_round_key"
      UNIQUE ("judgeId", "applicationId", "roundId");
  END IF;
END$$;

-- One row per fixed phase id (lga, senatorial, gf-r1..gf-r5) — rows are
-- created lazily (findOrCreate, default "pending") by phase-state.helpers.ts
-- rather than seeded here, so this migration stays purely structural.
CREATE TABLE IF NOT EXISTS "PhaseState" (
  "phaseId" VARCHAR(16) PRIMARY KEY,
  "status" "enum_PhaseState_status" NOT NULL DEFAULT 'pending',
  "openedAt" TIMESTAMPTZ,
  "openedBy" UUID REFERENCES "AdminUser"("id"),
  "closedAt" TIMESTAMPTZ,
  "closedBy" UUID REFERENCES "AdminUser"("id"),
  "countedJudgeIds" JSONB,
  "resultsSubmittedAt" TIMESTAMPTZ,
  "resultsSubmittedBy" UUID REFERENCES "AdminUser"("id"),
  "reopenedAt" TIMESTAMPTZ,
  "reopenedBy" UUID REFERENCES "AdminUser"("id"),
  "passedIds" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
