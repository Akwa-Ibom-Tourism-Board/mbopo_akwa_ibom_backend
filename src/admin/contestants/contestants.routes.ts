import express from "express";
import Joi from "joi";
import { validateQuery, validateParams } from "../../configurations/validate";
import validate from "../../configurations/validate";
import authenticateAdmin from "../middleware/authenticate-admin";
import requireCapability from "../middleware/require-capability";
import { AKWA_IBOM_LGAS } from "../../configurations/constants";
import { PHOTO_FIELDS } from "../../configurations/cloudinary";
import { draftSchema } from "../../applicants/application/application.routes";
import list from "./controllers/list";
import getOne from "./controllers/get-one";
import photoSignature from "./controllers/photo-signature";
import updateProfile from "./controllers/update-profile";
import updateDetails from "./controllers/update-details";
import documentSignature from "./controllers/document-signature";
import saveDocument from "./controllers/save-document";
import retryVinVerification from "./controllers/retry-vin-verification";

const router = express.Router();

const idParamSchema = Joi.object({ id: Joi.string().uuid().required() });

const listQuerySchema = Joi.object({
  search: Joi.string().trim().max(200).allow("").optional(),
  lga: Joi.string()
    .valid(...AKWA_IBOM_LGAS)
    .optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(200).optional(),
});

const YOUTUBE_URL_PATTERN = /^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;

const profileUpdateSchema = Joi.object({
  bio: Joi.string().trim().max(2000).allow("", null).optional(),
  additionalPhotos: Joi.array().items(Joi.string().uri()).max(20).optional(),
  additionalVideos: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().trim().min(1).max(150).required(),
        youtubeUrl: Joi.string().pattern(YOUTUBE_URL_PATTERN).required().messages({
          "string.pattern.base": "youtubeUrl must be a youtube.com or youtu.be link",
        }),
      }),
    )
    .max(20)
    .optional(),
})
  .min(1)
  .messages({ "object.min": "Provide at least one field to update" });

const documentSignatureSchema = Joi.object({
  field: Joi.string()
    .valid(...PHOTO_FIELDS)
    .required(),
});

const saveDocumentSchema = Joi.object({
  field: Joi.string()
    .valid(...PHOTO_FIELDS)
    .required(),
  url: Joi.string().uri().required(),
  publicId: Joi.string().required(),
});

// "candidates.view" is the broadest of the three candidate capabilities
// (Media included) — field-level redaction down to what each role may
// actually see happens inside serializeCandidateForViewer, not via
// separate routes per tier.
router.get(
  "/",
  authenticateAdmin,
  requireCapability("candidates.view"),
  validateQuery(listQuerySchema),
  list,
);
router.get(
  "/:id",
  authenticateAdmin,
  requireCapability("candidates.view"),
  validateParams(idParamSchema),
  getOne,
);
router.post(
  "/:id/photo-signature",
  authenticateAdmin,
  requireCapability("media.upload"),
  validateParams(idParamSchema),
  photoSignature,
);
router.patch(
  "/:id/profile",
  authenticateAdmin,
  requireCapability("candidates.editPublicProfile"),
  validateParams(idParamSchema),
  validate(profileUpdateSchema),
  updateProfile,
);
router.patch(
  "/:id/details",
  authenticateAdmin,
  requireCapability("candidates.editDetails"),
  validateParams(idParamSchema),
  validate(draftSchema),
  updateDetails,
);
router.post(
  "/:id/retry-vin-verification",
  authenticateAdmin,
  requireCapability("candidates.retryVinVerification"),
  validateParams(idParamSchema),
  retryVinVerification,
);
router.post(
  "/:id/document-signature",
  authenticateAdmin,
  requireCapability("candidates.editDetails"),
  validateParams(idParamSchema),
  validate(documentSignatureSchema),
  documentSignature,
);
router.patch(
  "/:id/document",
  authenticateAdmin,
  requireCapability("candidates.editDetails"),
  validateParams(idParamSchema),
  validate(saveDocumentSchema),
  saveDocument,
);

export default router;
