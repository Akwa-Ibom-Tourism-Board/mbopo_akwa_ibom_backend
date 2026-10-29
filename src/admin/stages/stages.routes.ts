import express from "express";
import Joi from "joi";
import { validateParams } from "../../configurations/validate";
import authenticateAdmin from "../middleware/authenticate-admin";
import requireCapability from "../middleware/require-capability";
import { ALL_PHASE_IDS } from "../judging/phases.config";
import getPhaseStates from "./controllers/get-phase-states";
import getStageCandidates from "./controllers/get-stage-candidates";
import openPhase from "./controllers/open-phase";
import closePhase from "./controllers/close-phase";
import reopenPhase from "./controllers/reopen-phase";

const router = express.Router();

const phaseParamSchema = Joi.object({
  phase: Joi.string()
    .valid(...ALL_PHASE_IDS)
    .required(),
});

router.get("/", authenticateAdmin, requireCapability("stages.view"), getPhaseStates);
router.get(
  "/:phase/candidates",
  authenticateAdmin,
  requireCapability("stages.view"),
  validateParams(phaseParamSchema),
  getStageCandidates,
);
router.post(
  "/:phase/open",
  authenticateAdmin,
  requireCapability("stages.open"),
  validateParams(phaseParamSchema),
  openPhase,
);
router.post(
  "/:phase/close",
  authenticateAdmin,
  requireCapability("stages.close"),
  validateParams(phaseParamSchema),
  closePhase,
);
router.post(
  "/:phase/reopen",
  authenticateAdmin,
  requireCapability("stages.open"),
  validateParams(phaseParamSchema),
  reopenPhase,
);

export default router;
