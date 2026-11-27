-- Additive and idempotent. `database.sync()` only alters tables in
-- development, so run this by hand against production before deploying.
-- Lets an Admin/Super Admin close registration either partway (new
-- sign-ups stop, existing applicants can still finish filling theirs out)
-- or all the way (nobody — new or existing — can register or submit).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_RegistrationSetting_status') THEN
    CREATE TYPE "enum_RegistrationSetting_status" AS ENUM ('open', 'new_intake_closed', 'closed');
  END IF;
END$$;

-- Singleton row (id is always 1) — see registration/registration.helpers.ts's
-- getOrCreateRegistrationSetting().
CREATE TABLE IF NOT EXISTS "RegistrationSetting" (
  "id" INTEGER PRIMARY KEY,
  "status" "enum_RegistrationSetting_status" NOT NULL DEFAULT 'open',
  "updatedBy" UUID REFERENCES "AdminUser"("id"),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO "RegistrationSetting" ("id", "status")
VALUES (1, 'open')
ON CONFLICT ("id") DO NOTHING;
