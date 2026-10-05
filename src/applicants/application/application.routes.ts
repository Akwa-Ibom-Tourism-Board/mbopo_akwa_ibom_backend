import express from "express";
import Joi from "joi";
import validate from "../../configurations/validate";
import authenticate from "../../configurations/authenticate";
import { PHOTO_FIELDS } from "../../configurations/cloudinary";
import { AKWA_IBOM_LGAS } from "../../configurations/constants";

import saveDraft from "./controllers/save-draft";
import getDraft from "./controllers/get-draft";
import updateDraft from "./controllers/update-draft";
import uploadPhoto from "./controllers/upload-photo";
import submit from "./controllers/submit";
import getMine from "./controllers/get-mine";

const router = express.Router();

// Loose — every field optional and nullable/blank (the frontend echoes the
// stored draft back, where untouched fields are null); only whatever is present gets validated.
// Used by both the draft create/update routes and as a starting point for
// the full submit schema below. Everything here is freely re-editable
// while the application is still a Draft — the video pitch is not part of
// this schema at all: it's uploaded (and locked) through /photo, never
// through /draft. See upload-photo.service.ts's videoPitch lock check.
const draftFieldSchema = {
  middleName: Joi.string().trim().max(100).allow("", null).optional(),
  phone: Joi.string().trim().max(32).allow("", null).optional(),
  socialMedia: Joi.string().trim().max(200).allow("", null).optional(),
  nextOfKin: Joi.string().trim().max(150).allow("", null).optional(),
  nextOfKinPhone: Joi.string().trim().max(32).allow("", null).optional(),
  village: Joi.string().trim().max(150).allow("", null).optional(),
  residenceState: Joi.string().trim().max(100).allow("", null).optional(),
  city: Joi.string().trim().max(100).allow("", null).optional(),
  address: Joi.string().trim().max(500).allow("", null).optional(),
  education: Joi.string().trim().max(150).allow("", null).optional(),
  institution: Joi.string().trim().max(200).allow("", null).optional(),
  // Only meaningful when institution/occupation is literally "Other" —
  // enforced as required in applicationSubmitSchema below, via .when();
  // a draft just stores whatever's there, same as any other free text.
  institutionOther: Joi.string().trim().max(150).allow("", null).optional(),
  occupation: Joi.string().trim().max(150).allow("", null).optional(),
  occupationOther: Joi.string().trim().max(100).allow("", null).optional(),
  talents: Joi.string().trim().max(1000).allow("", null).optional(),
  languages: Joi.string().trim().max(300).allow("", null).optional(),
  initiative: Joi.string().trim().max(2000).allow("", null).optional(),
  why: Joi.string().trim().max(3000).allow("", null).optional(),
  // Plain draft text — never triggers a DVP call; only final submit does.
  vin: Joi.string().trim().length(19).alphanum().uppercase().allow("", null).optional().messages({
    "string.length": "VIN must be exactly 19 characters",
    "string.alphanum": "VIN must contain only letters and numbers",
  }),
  localGovernment: Joi.string().trim().valid(...AKWA_IBOM_LGAS).allow("", null).optional().messages({
    "any.only": "localGovernment must be a valid Akwa Ibom LGA",
  }),
  declarationIdentity: Joi.boolean().allow(null).optional(),
  declarationAccuracy: Joi.boolean().allow(null).optional(),
  declarationTerms: Joi.boolean().allow(null).optional(),
};

export const draftSchema = Joi.object(draftFieldSchema);

// The full schema an application must satisfy to submit — every field
// required (middleName/socialMedia/institution/initiative excepted, which
// stay optional per the frontend's RegistrationFormValues), every photo URL
// present (including both full-image slots) and the video pitch URL
// present, all three declarations explicitly true. Run in submit.service.ts
// against the merged draft, not directly as route middleware, since submit
// validates stored + incoming data together.
export const applicationSubmitSchema = Joi.object({
  ...draftFieldSchema,
  phone: Joi.string().trim().required(),
  nextOfKin: Joi.string().trim().required(),
  nextOfKinPhone: Joi.string().trim().required(),
  village: Joi.string().trim().required(),
  residenceState: Joi.string().trim().required(),
  city: Joi.string().trim().required(),
  address: Joi.string().trim().required(),
  education: Joi.string().trim().required(),
  occupation: Joi.string().trim().required(),
  // Required only when the paired dropdown is "Other" — mirrors the
  // frontend's own cross-field zod .refine() in schema.ts.
  occupationOther: Joi.string().trim().max(100).allow("", null).optional().when("occupation", {
    is: "Other",
    then: Joi.string().trim().min(1).required(),
  }),
  institutionOther: Joi.string().trim().max(150).allow("", null).optional().when("institution", {
    is: "Other",
    then: Joi.string().trim().min(1).required(),
  }),
  talents: Joi.string().trim().required(),
  languages: Joi.string().trim().required(),
  why: Joi.string().trim().required(),
  vin: Joi.string().trim().length(19).alphanum().uppercase().required(),
  localGovernment: Joi.string().trim().valid(...AKWA_IBOM_LGAS).required(),
  declarationIdentity: Joi.boolean().valid(true).required(),
  declarationAccuracy: Joi.boolean().valid(true).required(),
  declarationTerms: Joi.boolean().valid(true).required(),
  certificateOfOriginUrl: Joi.string().trim().required(),
  fullImageUrl: Joi.string().trim().required(),
  fullImageUrl2: Joi.string().trim().required(),
  videoPitchUrl: Joi.string().trim().required(),
}).messages({
  "any.required": "{{#label}} is required",
  "any.only": "{{#label}} must be accepted",
  "string.empty": "{{#label}} is required",
  "string.base": "{{#label}} is required",
  "boolean.base": "{{#label}} must be accepted",
});

const photoFieldSchema = Joi.object({
  field: Joi.string()
    .valid(...PHOTO_FIELDS)
    .required()
    .messages({
      "any.only": `field must be one of ${PHOTO_FIELDS.join(", ")}`,
      "any.required": "field is required",
    }),
  url: Joi.string()
    .trim()
    .uri({ scheme: "https" })
    .max(2048)
    .required()
    .messages({
      "any.required": "url is required",
      "string.uri": "url must be a valid https URL",
    }),
  publicId: Joi.string().trim().max(512).required().messages({
    "any.required": "publicId is required",
  }),
  // Accepted for future usage reporting; not persisted.
  bytes: Joi.number().integer().min(0).optional(),
});

router.post("/draft", authenticate, validate(draftSchema), saveDraft);
router.get("/draft", authenticate, getDraft);
router.patch("/draft", authenticate, validate(draftSchema), updateDraft);
router.post("/photo", authenticate, validate(photoFieldSchema), uploadPhoto);
router.post("/submit", authenticate, validate(draftSchema), submit);
router.get("/", authenticate, getMine);

export default router;
