-- Additive and idempotent. `database.sync()` only alters tables in
-- development, so run this by hand against production before deploying.
-- Lets a complaint-style conversation thread also be started by staff (from
-- the admin Participants view) rather than only ever by the applicant via
-- the "Ask Me" widget or an email to info@akhtdc.com.ng.

ALTER TYPE "enum_Message_source" ADD VALUE IF NOT EXISTS 'admin';
