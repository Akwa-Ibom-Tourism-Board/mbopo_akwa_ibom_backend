import express from "express";
import Joi from "joi";
import validate from "../configurations/validate";
import authenticate from "../configurations/authenticate";
import { limiter, otpResendLimiter } from "../configurations/rate-limit";
import verifyCaptcha from "../configurations/captcha";
import { NIGERIAN_PHONE_REGEX } from "../configurations/constants";

import register from "./controllers/register";
import identityCheck from "./controllers/identity-check";
import verifyEmailOtp from "./controllers/verify-email-otp";
import resendEmailOtp from "./controllers/resend-email-otp";
import login from "./controllers/login";
import loginRequestOtp from "./controllers/login-request-otp";
import loginVerifyOtp from "./controllers/login-verify-otp";
import forgotPassword from "./controllers/forgot-password";
import resetPassword from "./controllers/reset-password";
import me from "./controllers/me";
import updateMe from "./controllers/update-me";
import changePassword from "./controllers/change-password";
import logout from "./controllers/logout";
import uploadAvatar from "./controllers/upload-avatar";

const router = express.Router();

const emailSchema = Joi.string().trim().email().lowercase().max(254).required().messages({
  "string.email": "Invalid email format",
  "any.required": "Email is required",
});

const ninSchema = Joi.string()
  .trim()
  .length(11)
  .pattern(/^\d{11}$/)
  .required()
  .messages({
    "string.length": "NIN must be exactly 11 digits",
    "string.pattern.base": "NIN must contain only digits",
    "any.required": "NIN is required",
  });

const vinSchema = Joi.string()
  .trim()
  .length(19)
  .alphanum()
  .required()
  .messages({
    "string.length": "VIN must be exactly 19 characters",
    "string.alphanum": "VIN must contain only letters and numbers",
    "any.required": "VIN is required",
  });

const phoneSchema = Joi.string().trim().pattern(NIGERIAN_PHONE_REGEX).required().messages({
  "string.pattern.base": "Invalid Nigerian phone number. Format: 0803XXXXXXX or 234803XXXXXXX",
  "any.required": "Phone number is required",
});

const otpSchema = Joi.string().trim().length(6).pattern(/^\d{6}$/).required().messages({
  "string.length": "Code must be exactly 6 digits",
  "string.pattern.base": "Code must be exactly 6 digits",
  "any.required": "Code is required",
});

const passwordSchema = Joi.string().min(8).max(72).required().messages({
  "string.min": "Password must be at least 8 characters",
  "any.required": "Password is required",
});

// Letters (any script), combining marks, spaces, apostrophes, hyphens, dots:
// no angle brackets or other markup can be stored in a name.
const personNameSchema = Joi.string()
  .trim()
  .min(1)
  .max(100)
  .pattern(/^[\p{L}\p{M}][\p{L}\p{M}' .-]*$/u)
  .messages({ "string.pattern.base": "Name contains invalid characters" });

const registerSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema,
});
const identityCheckSchema = Joi.object({ nin: ninSchema, vin: vinSchema });
const verifyEmailOtpSchema = Joi.object({ email: emailSchema, otp: otpSchema });
const resendEmailOtpSchema = Joi.object({ email: emailSchema });
const loginSchema = Joi.object({
  email: emailSchema,
  password: Joi.string().max(72).required().messages({ "any.required": "Password is required" }),
});
const loginRequestOtpSchema = Joi.object({ email: emailSchema });
const loginVerifyOtpSchema = Joi.object({ email: emailSchema, otp: otpSchema });
const forgotPasswordSchema = Joi.object({ email: emailSchema });
const resetPasswordSchema = Joi.object({
  token: Joi.string().trim().pattern(/^[a-f0-9]{64}$/).required().messages({
    "string.pattern.base": "Invalid or expired reset token",
    "any.required": "Reset token is required",
  }),
  password: passwordSchema,
});
const updateMeSchema = Joi.object({
  firstName: personNameSchema.optional(),
  lastName: personNameSchema.optional(),
  phoneNumber: phoneSchema.optional(),
});
const avatarSchema = Joi.object({
  url: Joi.string().trim().uri({ scheme: "https" }).max(2048).required().messages({
    "any.required": "url is required",
    "string.uri": "url must be a valid https URL",
  }),
  publicId: Joi.string().trim().max(512).required().messages({
    "any.required": "publicId is required",
  }),
  // Accepted for future usage reporting; not persisted.
  bytes: Joi.number().integer().min(0).optional(),
});
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().max(72).required().messages({ "any.required": "Current password is required" }),
  newPassword: passwordSchema,
});

router.post("/register", limiter, verifyCaptcha, validate(registerSchema), register);
router.post(
  "/identity-check",
  authenticate,
  limiter,
  verifyCaptcha,
  validate(identityCheckSchema),
  identityCheck,
);
router.post("/verify-email-otp", limiter, validate(verifyEmailOtpSchema), verifyEmailOtp);
router.post("/resend-email-otp", otpResendLimiter, validate(resendEmailOtpSchema), resendEmailOtp);
router.post("/login", limiter, verifyCaptcha, validate(loginSchema), login);
router.post("/login/request-otp", limiter, validate(loginRequestOtpSchema), loginRequestOtp);
router.post("/login/verify-otp", limiter, validate(loginVerifyOtpSchema), loginVerifyOtp);
router.post("/forgot-password", limiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", limiter, validate(resetPasswordSchema), resetPassword);
router.get("/me", authenticate, me);
router.patch("/me", authenticate, validate(updateMeSchema), updateMe);
router.post("/avatar", authenticate, validate(avatarSchema), uploadAvatar);
router.post("/change-password", authenticate, validate(changePasswordSchema), changePassword);
router.post("/logout", authenticate, logout);

export default router;
