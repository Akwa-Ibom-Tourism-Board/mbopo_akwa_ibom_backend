import express from "express";
import Joi from "joi";
import validate from "../../configurations/validate";
import authenticate from "../../configurations/authenticate";
import { limiter } from "../../configurations/rate-limit";
import { personNameSchema } from "../../auth/auth.schemas";
import verifyIdentity from "./controllers/verify-identity";

const router = express.Router();

const verifyIdentitySchema = Joi.object({
  nin: Joi.string()
    .trim()
    .length(11)
    .pattern(/^\d{11}$/)
    .required()
    .messages({
      "string.length": "NIN must be exactly 11 digits",
      "string.pattern.base": "NIN must contain only digits",
      "any.required": "NIN is required",
    }),
  firstName: personNameSchema.required().messages({ "any.required": "First name is required" }),
  lastName: personNameSchema.required().messages({ "any.required": "Last name is required" }),
  middleName: personNameSchema.optional().allow("", null),
  // Live selfie as a base64 data URI. `max` is checked before the pattern so
  // an oversized string never reaches the regex. The server always forces
  // must_check_image on — the client has no say in that.
  image: Joi.string()
    .trim()
    .max(1_400_000)
    .pattern(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/)
    .required()
    .messages({
      "string.pattern.base": "Image must be a base64 JPEG, PNG, or WebP data URI",
      "string.max": "Image must be no larger than 1MB",
      "any.required": "Image is required",
    }),
});

// Authenticated — reachable only once the applicant has registered,
// verified their email and logged in. One-time: verify-identity.service
// rejects a second call once `identityVerified` is true.
router.post(
  "/verify-identity",
  authenticate,
  limiter,
  validate(verifyIdentitySchema),
  verifyIdentity,
);

export default router;
