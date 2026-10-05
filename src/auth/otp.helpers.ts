import { database } from "../configurations/database";
import { User } from "./User";
import { compareHash } from "./auth.helpers";

export const MAX_OTP_ATTEMPTS = 5;

export type OtpOutcome = "ok" | "none" | "expired" | "locked" | "invalid";

/**
 * Verifies and consumes an emailed OTP in a single transaction holding a row
 * lock on the user. The lock is what makes the attempt cap real: with a plain
 * read-compare-then-increment, a burst of parallel guesses all read
 * "0 attempts" and get compared before any failure is counted, defeating the
 * limit. Here guesses are serialized, every wrong one is counted and
 * committed (we return the outcome instead of throwing inside the
 * transaction, which would roll the count back), and a correct code can be
 * used exactly once.
 */
export const verifyAndConsumeOtp = async (
  email: string,
  otp: string,
): Promise<{ outcome: OtpOutcome; user?: User }> =>
  database.transaction(async (transaction) => {
    const user = await User.findOne({
      where: { email: email.trim().toLowerCase() },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    const hash = user?.get("emailOtpHash") as string | null | undefined;
    if (!user || !hash) return { outcome: "none" as const };

    const expiresAt = user.get("emailOtpExpiresAt") as Date | null;
    if (!expiresAt || expiresAt.getTime() < Date.now()) return { outcome: "expired" as const };

    const attempts = user.get("emailOtpAttempts") as number;
    if (attempts >= MAX_OTP_ATTEMPTS) {
      await user.update(
        { emailOtpHash: null, emailOtpExpiresAt: null, emailOtpAttempts: 0 },
        { transaction },
      );
      return { outcome: "locked" as const };
    }

    if (!(await compareHash(otp, hash))) {
      const used = attempts + 1;
      if (used >= MAX_OTP_ATTEMPTS) {
        await user.update(
          { emailOtpHash: null, emailOtpExpiresAt: null, emailOtpAttempts: 0 },
          { transaction },
        );
        return { outcome: "locked" as const };
      }
      await user.update({ emailOtpAttempts: used }, { transaction });
      return { outcome: "invalid" as const };
    }

    await user.update(
      { emailVerified: true, emailOtpHash: null, emailOtpExpiresAt: null, emailOtpAttempts: 0 },
      { transaction },
    );
    return { outcome: "ok" as const, user };
  });
