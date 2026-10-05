import express from "express";
import Joi from "joi";
import validate from "../../configurations/validate";
import authenticate from "../../configurations/authenticate";
import { limiter } from "../../configurations/rate-limit";
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
  vin: Joi.string().trim().length(19).alphanum().required().messages({
    "string.length": "VIN must be exactly 19 characters",
    "string.alphanum": "VIN must contain only letters and numbers",
    "any.required": "VIN is required",
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
