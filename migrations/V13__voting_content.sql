-- Additive and idempotent. `database.sync()` only alters tables in
-- development, so run this by hand against production before deploying.
-- Admin-managed public voting-site content: vote pricing tiers, picture
-- news posts, sponsors.

CREATE TABLE IF NOT EXISTS "VoteTier" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "votes" INTEGER NOT NULL,
  "priceNaira" INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "NewsPost" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" VARCHAR(200) NOT NULL,
  "summary" VARCHAR(500) NOT NULL,
  "body" JSONB NOT NULL DEFAULT '[]',
  "coverImageUrl" TEXT,
  "coverImagePublicId" TEXT,
  "images" JSONB NOT NULL DEFAULT '[]',
  "videoUrls" JSONB NOT NULL DEFAULT '[]',
  "publishedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Sponsor" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(200) NOT NULL,
  "description" TEXT,
  "websiteUrl" TEXT,
  "logoUrl" TEXT,
  "logoPublicId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
