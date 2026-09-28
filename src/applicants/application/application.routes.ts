import express from "express";
import Joi from "joi";
import validate from "../../configurations/validate";
import authenticate from "../../configurations/authenticate";
import upload from "../../configurations/upload";

import saveDraft from "./controllers/save-draft";
import getDraft from "./controllers/get-draft";
import updateDraft from "./controllers/update-draft";
import uploadPhoto from "./controllers/upload-photo";
import submit from "./controllers/submit";
import getMine from "./controllers/get-mine";

const router = express.Router();

// Loose — every field optional, only whatever is present gets validated.
// Used by both the draft create/update routes and as a starting point for
// the full submit schema below.
const draftFieldSchema = {
  middleName: Joi.string().trim().allow("").optional(),
  phone: Joi.string().trim().optional(),
  socialMedia: Joi.string().trim().allow("").optional(),
  nextOfKin: Joi.string().trim().optional(),
  nextOfKinPhone: Joi.string().trim().optional(),
  village: Joi.string().trim().optional(),
  residenceState: Joi.string().trim().optional(),
  city: Joi.string().trim().optional(),
  address: Joi.string().trim().optional(),
  education: Joi.string().trim().optional(),
  institution: Joi.string().trim().allow("").optional(),
  occupation: Joi.string().trim().optional(),
  talents: Joi.string().trim().optional(),
  languages: Joi.string().trim().optional(),
  initiative: Joi.string().trim().allow("").optional(),
  why: Joi.string().trim().optional(),
  declarationIdentity: Joi.boolean().optional(),
  declarationAccuracy: Joi.boolean().optional(),
  declarationTerms: Joi.boolean().optional(),
};

export const draftSchema = Joi.object(draftFieldSchema);

// The full schema an application must satisfy to submit — every field
// required (middleName/socialMedia/institution/initiative excepted, which
// stay optional per the frontend's RegistrationFormValues), all three photo
// URLs present, all three declarations explicitly true. Run in
// submit.service.ts against the merged draft, not directly as route
// middleware, since submit validates stored + incoming data together.
export const applicationSubmitSchema = Joi.object({
  middleName: Joi.string().trim().allow("", null).optional(),
  phone: Joi.string().trim().required(),
  socialMedia: Joi.string().trim().allow("", null).optional(),
  nextOfKin: Joi.string().trim().required(),
  nextOfKinPhone: Joi.string().trim().required(),
  village: Joi.string().trim().required(),
  residenceState: Joi.string().trim().required(),
  city: Joi.string().trim().required(),
  address: Joi.string().trim().required(),
  education: Joi.string().trim().required(),
  institution: Joi.string().trim().allow("", null).optional(),
  occupation: Joi.string().trim().required(),
  talents: Joi.string().trim().required(),
  languages: Joi.string().trim().required(),
  initiative: Joi.string().trim().allow("", null).optional(),
  why: Joi.string().trim().required(),
  declarationIdentity: Joi.boolean().valid(true).required(),
  declarationAccuracy: Joi.boolean().valid(true).required(),
  declarationTerms: Joi.boolean().valid(true).required(),
  passportPhotoUrl: Joi.string().trim().required(),
  certificateOfOriginUrl: Joi.string().trim().required(),
  fullImageUrl: Joi.string().trim().required(),
}).messages({
  "any.required": "{{#label}} is required",
  "any.only": "{{#label}} must be accepted",
  "string.empty": "{{#label}} is required",
});

const photoFieldSchema = Joi.object({
  field: Joi.string()
    .valid("passportPhoto", "certificateOfOrigin", "fullImage")
    .required()
    .messages({
      "any.only":
        "field must be one of passportPhoto, certificateOfOrigin, fullImage",
      "any.required": "field is required",
    }),
});

router.post("/draft", authenticate, validate(draftSchema), saveDraft);
router.get("/draft", authenticate, getDraft);
router.patch("/draft", authenticate, validate(draftSchema), updateDraft);
router.post(
  "/photo",
  authenticate,
  upload.single("file"),
  validate(photoFieldSchema),
  uploadPhoto,
);
router.post("/submit", authenticate, validate(draftSchema), submit);
router.get("/", authenticate, getMine);

export default router;
