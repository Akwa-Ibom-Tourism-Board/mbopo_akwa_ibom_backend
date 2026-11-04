import express from "express";
import Joi from "joi";
import validate from "../configurations/validate";
import { limiter } from "../configurations/rate-limit";
import { MAX_COMPLAINT_ATTACHMENTS } from "../configurations/cloudinary";
import createMessage from "./controllers/create";
import attachmentSignature from "./controllers/attachment-signature";

const router = express.Router();

const attachmentSignatureSchema = Joi.object({
  submissionId: Joi.string().uuid().required(),
  slot: Joi.number()
    .integer()
    .min(0)
    .max(MAX_COMPLAINT_ATTACHMENTS - 1)
    .required(),
});

const attachmentSchema = Joi.object({
  url: Joi.string().uri().required(),
  filename: Joi.string().trim().max(255).required(),
  bytes: Joi.number()
    .integer()
    .min(1)
    .max(5 * 1024 * 1024)
    .required(),
});

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
  attachments: Joi.array().items(attachmentSchema).max(MAX_COMPLAINT_ATTACHMENTS).optional(),
});

// Public — no auth, so rate limiting is the only gate against spam.
router.post("/", limiter, validate(createMessageSchema), createMessage);
router.post(
  "/attachment-signature",
  limiter,
  validate(attachmentSignatureSchema),
  attachmentSignature,
);

export default router;
