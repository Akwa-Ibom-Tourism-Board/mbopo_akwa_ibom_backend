import express from "express";
import Joi from "joi";
import validate from "../configurations/validate";
import { limiter } from "../configurations/rate-limit";
import createMessage from "./controllers/create";

const router = express.Router();

const createMessageSchema = Joi.object({
  name: Joi.string().trim().min(1).max(150).required().messages({
    "any.required": "Name is required",
    "string.empty": "Name is required",
  }),
  email: Joi.string().trim().email().lowercase().max(254).required().messages({
    "string.email": "Invalid email format",
    "any.required": "Email is required",
    "string.empty": "Email is required",
  }),
  phoneNumber: Joi.string().trim().min(5).max(32).required().messages({
    "any.required": "Phone number is required",
    "string.empty": "Phone number is required",
  }),
  title: Joi.string().trim().max(200).allow("").optional(),
  message: Joi.string().trim().min(1).max(5000).required().messages({
    "any.required": "Message is required",
    "string.empty": "Message is required",
    "string.max": "Message must be at most 5000 characters",
  }),
});

// Public — no auth, so rate limiting is the only gate against spam.
router.post("/", limiter, validate(createMessageSchema), createMessage);

export default router;
