-- Additive and idempotent. `database.sync()` only alters tables in
-- development, so run this by hand against production before deploying.
-- New table entirely: staff accounts (Super Admin/Admin/Media/Judge/Head
-- Judge/Customer Service) are deliberately separate from the applicant
-- "User" table — no identity-verification baggage, own login flow. A
-- Super Admin row can only ever be inserted directly here, never through
-- any API — see src/admin/users/admin-users.service.ts.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_AdminUser_role') THEN
    CREATE TYPE "enum_AdminUser_role" AS ENUM (
      'super_admin', 'admin', 'media', 'judge', 'head_judge', 'customer_service'
    );
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "AdminUser" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "firstName" VARCHAR(255) NOT NULL,
  "lastName" VARCHAR(255) NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "enum_AdminUser_role" NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "passwordChangedAt" TIMESTAMPTZ,
  "refreshToken" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AdminUser_email_key'
  ) THEN
    ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_email_key" UNIQUE ("email");
  END IF;
END$$;
