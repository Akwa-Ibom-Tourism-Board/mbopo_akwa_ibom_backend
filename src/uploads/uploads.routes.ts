import express from "express";
import Joi from "joi";
import validate from "../configurations/validate";
import authenticate from "../configurations/authenticate";
import { limiter } from "../configurations/rate-limit";
import { UPLOAD_FIELDS } from "../configurations/cloudinary";
import cloudinarySignature from "./controllers/cloudinary-signature";

const router = express.Router();

const signatureSchema = Joi.object({
  field: Joi.string()
    .valid(...UPLOAD_FIELDS)
    .required()
    .messages({
      "any.only": `field must be one of ${UPLOAD_FIELDS.join(", ")}`,
      "any.required": "field is required",
    }),
});

router.post(
  "/cloudinary-signature",
  authenticate,
  limiter,
  validate(signatureSchema),
  cloudinarySignature,
);

export default router;
