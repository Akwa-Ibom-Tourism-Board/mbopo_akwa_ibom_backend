import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { StatusCodes } from "../../configurations/statusCodes";
import { queueEmail } from "../../configurations/email-queue";
import { User } from "../User";
import { generateNumericOtp, hashData } from "../auth.helpers";
import { emailVerificationOtpTemplate } from "../emailTemplates/emailVerificationOtp";

const EMAIL_OTP_TTL_MS = 10 * 60 * 1000;

const resendEmailOtpService = errorUtilities.withServiceErrorHandling(
  async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ where: { email: normalizedEmail } });

    if (user && !user.get("emailVerified")) {
      const otp = generateNumericOtp();

      console.log('TP', otp)

      await user.update({
        emailOtpHash: await hashData(otp),
        emailOtpExpiresAt: new Date(Date.now() + EMAIL_OTP_TTL_MS),
        emailOtpAttempts: 0,
      });

      const template = emailVerificationOtpTemplate(otp);
      await queueEmail({
        to: normalizedEmail,
        subject: template.subject,
        htmlBody: template.htmlBody,
      });
    }

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "If an account with this email exists and is unverified, a new code has been sent",
    );
  },
);

export default resendEmailOtpService;
