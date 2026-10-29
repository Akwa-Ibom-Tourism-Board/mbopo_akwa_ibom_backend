import express from "express";
import Joi from "joi";
import { validateParams } from "../../configurations/validate";
import authenticateAdmin from "../middleware/authenticate-admin";
import requireCapability from "../middleware/require-capability";
import list from "./controllers/list";
import listForCandidate from "./controllers/list-for-candidate";

const router = express.Router();

const idParamSchema = Joi.object({ id: Joi.string().uuid().required() });

router.get("/", authenticateAdmin, requireCapability("activity.view"), list);
router.get(
  "/candidate/:id",
  authenticateAdmin,
  requireCapability("candidates.viewActivity"),
  validateParams(idParamSchema),
  listForCandidate,
);

export default router;
