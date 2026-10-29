import { UniqueConstraintError } from "sequelize";
import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { StatusCodes } from "../../configurations/statusCodes";
import { queueEmail } from "../../configurations/email-queue";
import { User } from "../User";
import { generateNumericOtp, hashData } from "../auth.helpers";
import { emailVerificationOtpTemplate } from "../emailTemplates/emailVerificationOtp";

const EMAIL_OTP_TTL_MS = 10 * 60 * 1000;

export interface RegisterPayload {
  email: string;
  password: string;
}

// Account creation only — email + password. Identity (NIN/VIN, name,
// gender, DOB, LGA, ward) is no longer collected here: it's verified once,
// separately, from the applicant's dashboard after they've logged in. See
// applicants/registration/services/verify-identity.service.ts.
const registerService = errorUtilities.withServiceErrorHandling(
  async (payload: RegisterPayload) => {
    const email = payload.email.trim().toLowerCase();
    const otp = generateNumericOtp();

    try {
      // The unique constraint on email is the real duplicate guard — attempt
      // the create and translate a collision into a friendly error, rather
      // than a findOne pre-check (TOCTOU gap under concurrency).
      await User.create({
        email,
        password: await hashData(payload.password),
        identityVerified: false,
        emailVerified: false,
        emailOtpHash: await hashData(otp),
        emailOtpExpiresAt: new Date(Date.now() + EMAIL_OTP_TTL_MS),
        emailOtpAttempts: 0,
      } as any);
    } catch (error: any) {
      if (error instanceof UniqueConstraintError) {
        throw errorUtilities.createError(
          "An account with this email already exists",
          StatusCodes.BAD_REQUEST,
        );
      }
      throw error;
    }

    const template = emailVerificationOtpTemplate(otp);
    await queueEmail({
      to: email,
      subject: template.subject,
      htmlBody: template.htmlBody,
    });

    return responseUtilities.handleServicesResponse(
      StatusCodes.CREATED,
      "Account created, verification code sent",
      { email },
    );
  },
);

export default registerService;
