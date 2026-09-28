import express from "express";
import Joi from "joi";
import validate from "../../configurations/validate";
import { limiter } from "../../configurations/rate-limit";
import { NIGERIAN_PHONE_REGEX } from "../../configurations/constants";
import register from "./controllers/register";

const router = express.Router();

const registerSchema = Joi.object({
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
  vin: Joi.string().trim().length(19).required().messages({
    "string.length": "VIN must be exactly 19 characters",
    "any.required": "VIN is required",
  }),
  email: Joi.string().trim().email().lowercase().required().messages({
    "string.email": "Invalid email format",
    "any.required": "Email is required",
  }),
  phoneNumber: Joi.string()
    .trim()
    .pattern(NIGERIAN_PHONE_REGEX)
    .required()
    .messages({
      "string.pattern.base":
        "Invalid Nigerian phone number. Format: 0803XXXXXXX or 234803XXXXXXX",
      "any.required": "Phone number is required",
    }),
  password: Joi.string().min(8).max(128).required().messages({
    "string.min": "Password must be at least 8 characters",
    "any.required": "Password is required",
  }),
});

router.post("/register", limiter, validate(registerSchema), register);

export default router;
