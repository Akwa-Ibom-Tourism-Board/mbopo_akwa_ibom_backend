-- Additive and idempotent. `database.sync()` only alters tables in
-- development, so run this by hand against production before deploying.
-- Staff activity trail (global Activity Log + per-candidate Activity tab).
-- "actorId" null means a system event, not a staff action.

CREATE TABLE IF NOT EXISTS "ActivityLog" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "actorId" UUID REFERENCES "AdminUser"("id"),
  "applicationId" UUID REFERENCES "Application"("id"),
  "category" VARCHAR(32) NOT NULL,
  "summary" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ActivityLog_applicationId_idx" ON "ActivityLog" ("applicationId");
CREATE INDEX IF NOT EXISTS "ActivityLog_createdAt_idx" ON "ActivityLog" ("createdAt");
