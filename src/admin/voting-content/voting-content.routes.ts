import express from "express";
import Joi from "joi";
import { validateParams } from "../../configurations/validate";
import validate from "../../configurations/validate";
import authenticateAdmin from "../middleware/authenticate-admin";
import requireCapability from "../middleware/require-capability";
import uploadSignature from "./controllers/upload-signature";
import getTiers from "./controllers/get-tiers";
import saveTiers from "./controllers/save-tiers";
import listNews from "./controllers/list-news";
import saveNews from "./controllers/save-news";
import deleteNews from "./controllers/delete-news";
import listSponsors from "./controllers/list-sponsors";
import saveSponsor from "./controllers/save-sponsor";
import deleteSponsor from "./controllers/delete-sponsor";

const router = express.Router();

const idParamSchema = Joi.object({ id: Joi.string().uuid().required() });

const uploadSignatureSchema = Joi.object({
  scope: Joi.string().valid("news", "sponsor").required(),
  id: Joi.string().uuid().required(),
  slot: Joi.string().uuid().required(),
});

const tierSchema = Joi.object({
  votes: Joi.number().integer().positive().required(),
  priceNaira: Joi.number().integer().positive().required(),
});
const saveTiersSchema = Joi.object({
  tiers: Joi.array().items(tierSchema).min(1).required(),
});

const newsSchema = Joi.object({
  id: Joi.string().uuid().optional(),
  title: Joi.string().trim().min(1).max(200).required(),
  summary: Joi.string().trim().min(1).max(500).required(),
  body: Joi.array().items(Joi.string().trim().max(5000)).min(1).required(),
  coverImageUrl: Joi.string().uri().allow(null).optional(),
  images: Joi.array().items(Joi.string().uri()).max(20).optional(),
  videoUrls: Joi.array().items(Joi.string().uri()).max(20).optional(),
  publishedAt: Joi.string().isoDate().optional(),
});

const sponsorSchema = Joi.object({
  id: Joi.string().uuid().optional(),
  name: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().max(2000).allow("", null).optional(),
  websiteUrl: Joi.string().uri().allow("", null).optional(),
  logoUrl: Joi.string().uri().allow(null).optional(),
});

// "voting.pricing" / "voting.news" / "voting.sponsors" each gate their own
// sub-area — Media holds news/sponsors but never pricing (see rbac.ts).
router.post(
  "/upload-signature",
  authenticateAdmin,
  requireCapability("voting.news"),
  validate(uploadSignatureSchema),
  uploadSignature,
);

router.get("/pricing", authenticateAdmin, requireCapability("voting.pricing"), getTiers);
router.put(
  "/pricing",
  authenticateAdmin,
  requireCapability("voting.pricing"),
  validate(saveTiersSchema),
  saveTiers,
);

router.get("/news", authenticateAdmin, requireCapability("voting.news"), listNews);
router.post("/news", authenticateAdmin, requireCapability("voting.news"), validate(newsSchema), saveNews);
router.delete(
  "/news/:id",
  authenticateAdmin,
  requireCapability("voting.news"),
  validateParams(idParamSchema),
  deleteNews,
);

router.get("/sponsors", authenticateAdmin, requireCapability("voting.sponsors"), listSponsors);
router.post(
  "/sponsors",
  authenticateAdmin,
  requireCapability("voting.sponsors"),
  validate(sponsorSchema),
  saveSponsor,
);
router.delete(
  "/sponsors/:id",
  authenticateAdmin,
  requireCapability("voting.sponsors"),
  validateParams(idParamSchema),
  deleteSponsor,
);

export default router;
