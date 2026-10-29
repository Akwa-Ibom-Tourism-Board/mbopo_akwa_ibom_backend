import express from "express";
import Joi from "joi";
import { validateQuery, validateParams } from "../../configurations/validate";
import validate from "../../configurations/validate";
import authenticateAdmin from "../middleware/authenticate-admin";
import requireCapability from "../middleware/require-capability";
import list from "./controllers/list";
import getOne from "./controllers/get-one";
import setActive from "./controllers/set-active";
import deleteApplicant from "./controllers/delete";

const router = express.Router();

const idParamSchema = Joi.object({ id: Joi.string().uuid().required() });

const listQuerySchema = Joi.object({
  search: Joi.string().trim().max(200).allow("").optional(),
  status: Joi.string().valid("not_started", "in_progress", "submitted").optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(200).optional(),
});

const setActiveSchema = Joi.object({ active: Joi.boolean().required() });

router.get(
  "/",
  authenticateAdmin,
  requireCapability("applicants.view"),
  validateQuery(listQuerySchema),
  list,
);
router.get(
  "/:id",
  authenticateAdmin,
  requireCapability("applicants.view"),
  validateParams(idParamSchema),
  getOne,
);
router.patch(
  "/:id/active",
  authenticateAdmin,
  requireCapability("applicants.manage"),
  validateParams(idParamSchema),
  validate(setActiveSchema),
  setActive,
);
router.delete(
  "/:id",
  authenticateAdmin,
  requireCapability("applicants.manage"),
  validateParams(idParamSchema),
  deleteApplicant,
);

export default router;
