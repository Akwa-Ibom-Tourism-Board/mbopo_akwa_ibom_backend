import { Transaction } from "sequelize";
import { v4 as uuid } from "uuid";
import { database } from "../../configurations/database";
import errorUtilities from "../../configurations/error-handler";
import { StatusCodes } from "../../configurations/statusCodes";
import { User } from "../../auth/User";
import { Application, ApplicationStatus } from "./Application";

/** "uYo cITY" -> "Uyo city". For free-text only — never codes (VIN/NIN). */
export function toSentenceCase(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

// occupation/institution are deliberately excluded: both are dropdown
// values that must match a fixed option list exactly (e.g. "Entrepreneur /
// Business Owner", "University of Uyo") -- sentence-casing them produces a
// still-plausible-looking string ("Entrepreneur / business owner") that no
// longer matches anything in the frontend's whitelist, so a resumed draft
// fails validation on a value that looks fine on screen. Free-text fields
// don't have this problem since they're not validated against a fixed list.
const SENTENCE_CASE_FIELDS = [
  "middleName",
  "nextOfKin",
  "village",
  "city",
  "address",
  "talents",
  "languages",
  "initiative",
  "why",
  "occupationOther",
  "institutionOther",
] as const;

/**
 * Defense-in-depth backstop for the frontend's own formatting: sentence-cases
 * the free-text fields of a draft/submit payload before it's written.
 */
export const normalizeDraftPayload = (payload: Record<string, any>): Record<string, any> => {
  const normalized = { ...payload };
  for (const field of SENTENCE_CASE_FIELDS) {
    if (typeof normalized[field] === "string") {
      normalized[field] = toSentenceCase(normalized[field]);
    }
  }
  return normalized;
};

export const SUBMITTED_ERROR =
  "This application has already been submitted and can no longer be edited";
export const UNVERIFIED_ERROR =
  "Please verify your NIN before starting your application";

/**
 * Fetches the applicant's Application with a row lock (SELECT ... FOR
 * UPDATE), so concurrent edits / photo saves / submit serialize on the row
 * instead of acting on a stale read. Must run inside `transaction`.
 */
export const findApplicationForUpdate = (
  applicantId: string,
  transaction: Transaction,
) =>
  Application.findOne({
    where: { applicantId },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

export const assertIdentityVerified = async (
  applicantId: string,
  transaction: Transaction,
) => {
  const applicant = await User.findByPk(applicantId, { transaction });
  if (!applicant?.get("identityVerified")) {
    throw errorUtilities.createError(UNVERIFIED_ERROR, StatusCodes.FORBIDDEN);
  }
};

export const assertDraft = (application: Application) => {
  if (application.get("status") !== ApplicationStatus.Draft) {
    throw errorUtilities.createError(SUBMITTED_ERROR, StatusCodes.CONFLICT);
  }
};

/**
 * Returns the applicant's locked draft, creating it first if needed.
 *
 * Creation is `INSERT ... ON CONFLICT DO NOTHING` against the applicantId
 * unique index, then a locking re-read: if two requests race to create, one
 * inserts and the other silently no-ops, and both then queue on the same row
 * lock. (A plain create() that throws on the unique violation would abort
 * the surrounding Postgres transaction.)
 */
export const lockOrCreateDraft = async (
  applicantId: string,
  transaction: Transaction,
): Promise<{ application: Application; created: boolean }> => {
  let application = await findApplicationForUpdate(applicantId, transaction);
  if (application) {
    assertDraft(application);
    return { application, created: false };
  }

  await assertIdentityVerified(applicantId, transaction);

  // Raw statement because the model API can't report whether the insert
  // actually happened (needed for the 201 vs 200 distinction).
  const [insertedRows] = await database.query(
    `INSERT INTO "Application" ("id", "applicantId", "status", "declarationIdentity", "declarationAccuracy", "declarationTerms", "createdAt", "updatedAt")
     VALUES (:id, :applicantId, :status, false, false, false, NOW(), NOW())
     ON CONFLICT ("applicantId") DO NOTHING
     RETURNING "id"`,
    {
      replacements: {
        id: uuid(),
        applicantId,
        status: ApplicationStatus.Draft,
      },
      transaction,
    },
  );
  const created = (insertedRows as unknown[]).length > 0;

  application = await findApplicationForUpdate(applicantId, transaction);
  if (!application) {
    throw errorUtilities.createError(
      "Could not start application, please retry",
      StatusCodes.CONFLICT,
    );
  }
  assertDraft(application);
  return { application, created };
};
