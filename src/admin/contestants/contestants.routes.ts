import express from "express";
import Joi from "joi";
import { validateQuery, validateParams } from "../../configurations/validate";
import authenticateAdmin from "../middleware/authenticate-admin";
import requireCapability from "../middleware/require-capability";
import { AKWA_IBOM_LGAS } from "../../configurations/constants";
import list from "./controllers/list";
import getOne from "./controllers/get-one";

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

export default router;
