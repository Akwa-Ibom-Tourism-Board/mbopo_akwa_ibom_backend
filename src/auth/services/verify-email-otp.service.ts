import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { StatusCodes } from "../../configurations/statusCodes";
import { verifyAndConsumeOtp } from "../otp.helpers";
import { createNotification } from "../../notifications/services/create.service";
import { NotificationType } from "../../notifications/Notification";

const verifyEmailOtpService = errorUtilities.withServiceErrorHandling(
  async (email: string, otp: string) => {
    const { outcome, user } = await verifyAndConsumeOtp(email, otp);

    if (outcome === "none") {
      throw errorUtilities.createError(
        "No verification code found for this email, please request a new one",
        StatusCodes.BAD_REQUEST,
      );
    }
    if (outcome === "expired") {
      throw errorUtilities.createError(
        "Verification code has expired. Please request a new one.",
        StatusCodes.GONE,
      );
    }
    if (outcome === "locked") {
      throw errorUtilities.createError(
        "Too many incorrect attempts. Please request a new code.",
        StatusCodes.TOO_MANY_REQUESTS,
      );
    }
    if (outcome === "invalid" || !user) {
      throw errorUtilities.createError("Invalid verification code", StatusCodes.UNAUTHORIZED);
    }

    await createNotification({
      userId: user.get("id") as string,
      title: "Welcome to Mbopo Akwa Ibom",
      body: "Your email has been verified. You can now complete your application.",
      type: NotificationType.Account,
    });

    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Email verified successfully");
  },
);

export default verifyEmailOtpService;
