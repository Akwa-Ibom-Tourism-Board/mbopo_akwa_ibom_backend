import { UniqueConstraintError } from "sequelize";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { queueEmail } from "../../../configurations/email-queue";
import { User } from "../../../auth/User";
import { generateNumericOtp, hashData } from "../../../auth/auth.helpers";
import { emailVerificationOtpTemplate } from "../../../auth/emailTemplates/emailVerificationOtp";
import { verifyAndEvaluateEligibility } from "../../../auth/services/identity-check.service";

const EMAIL_OTP_TTL_MS = 10 * 60 * 1000;

export interface RegisterPayload {
  nin: string;
  vin: string;
  email: string;
  phoneNumber: string;
  password: string;
}

// Maps the violated column name (Sequelize parses this out of the DB error
// into UniqueConstraintError#fields) to a friendly field label for the
// duplicate-account error message.
const DUPLICATE_FIELD_LABELS: Record<string, string> = {
  email: "email",
  nin: "NIN",
  vin: "VIN",
};

const registerService = errorUtilities.withServiceErrorHandling(
  async (payload: RegisterPayload) => {
    const email = payload.email.trim().toLowerCase();

    // Never trust a client-resubmitted identity-check response — re-verify
    // NIN/VIN and re-run §8 eligibility here, at registration time.
    const { eligible, reasons, identity } = await verifyAndEvaluateEligibility(
      payload.nin,
      payload.vin,
    );

    if (!eligible) {
      return responseUtilities.handleServicesResponse(
        StatusCodes.UNPROCESSABLE_ENTITY,
        "You are not eligible to register",
        { reasons },
      );
    }

    const otp = generateNumericOtp();

    try {
      // Unique constraints on nin/vin/email are the real duplicate guard —
      // attempt the create and translate a collision into a friendly error,
      // rather than a findOne pre-check (TOCTOU gap under concurrency).
      await User.create({
        email,
        nin: identity.nin,
        vin: identity.vin,
        firstName: identity.firstName,
        lastName: identity.lastName,
        gender: identity.gender,
        dateOfBirth: identity.dateOfBirth,
        localGovernment: identity.localGovernment,
        ward: identity.ward,
        phoneNumber: payload.phoneNumber,
        password: await hashData(payload.password),
        emailVerified: false,
        emailOtpHash: await hashData(otp),
        emailOtpExpiresAt: new Date(Date.now() + EMAIL_OTP_TTL_MS),
        emailOtpAttempts: 0,
      } as any);
    } catch (error: any) {
      if (error instanceof UniqueConstraintError) {
        const violatedField = Object.keys(error.fields || {})[0];
        const field =
          (violatedField && DUPLICATE_FIELD_LABELS[violatedField]) ||
          "account details";
        throw errorUtilities.createError(
          `An account with this ${field} already exists`,
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
