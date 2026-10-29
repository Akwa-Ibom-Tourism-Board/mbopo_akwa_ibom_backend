import express from "express";
import Joi from "joi";
import { validateQuery, validateParams } from "../../configurations/validate";
import validate from "../../configurations/validate";
import authenticateAdmin from "../middleware/authenticate-admin";
import requireCapability from "../middleware/require-capability";
import { ALL_PHASE_IDS } from "./phases.config";
import { SCORE_MIN, SCORE_MAX } from "./stages.config";
import { JudgeScoreStatus } from "./JudgeScore";
import getStages from "./controllers/get-stages";
import getJudges from "./controllers/get-judges";
import getMyScores from "./controllers/get-my-scores";
import saveScore from "./controllers/save-score";
import disqualify from "./controllers/disqualify";
import getLeaderboard from "./controllers/get-leaderboard";
import getResultsStandings from "./controllers/get-results-standings";
import getFinalizeStatus from "./controllers/get-finalize-status";
import submitResults from "./controllers/submit-results";
import submitResultsAndClose from "./controllers/submit-results-and-close";

const router = express.Router();

const phaseParamSchema = Joi.object({
  phase: Joi.string()
    .valid(...ALL_PHASE_IDS)
    .required(),
});

const myScoresQuerySchema = Joi.object({
  applicationId: Joi.string().uuid().optional(),
  phase: Joi.string()
    .valid(...ALL_PHASE_IDS)
    .optional(),
});

const saveScoreSchema = Joi.object({
  applicationId: Joi.string().uuid().required(),
  roundId: Joi.string().required(),
  values: Joi.object().pattern(Joi.string(), Joi.number().min(SCORE_MIN).max(SCORE_MAX)).required(),
  status: Joi.string()
    .valid(...Object.values(JudgeScoreStatus))
    .required(),
  question: Joi.string().trim().max(1000).optional(),
  cause: Joi.string().trim().max(100).optional(),
});

const disqualifySchema = Joi.object({
  applicationIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
  reason: Joi.string().trim().min(1).max(1000).required(),
});

const passedIdsSchema = Joi.object({
  passedIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

router.get("/stages", authenticateAdmin, requireCapability("stages.view"), getStages);
router.get(
  "/judges/:phase",
  authenticateAdmin,
  requireCapability("judging.access"),
  validateParams(phaseParamSchema),
  getJudges,
);
router.get(
  "/my-scores",
  authenticateAdmin,
  requireCapability("judging.access"),
  validateQuery(myScoresQuerySchema),
  getMyScores,
);
router.post(
  "/scores",
  authenticateAdmin,
  requireCapability("judging.score"),
  validate(saveScoreSchema),
  saveScore,
);
router.post(
  "/disqualify",
  authenticateAdmin,
  requireCapability("judging.decide"),
  validate(disqualifySchema),
  disqualify,
);
router.get(
  "/leaderboard/:phase",
  authenticateAdmin,
  requireCapability("judging.leaderboard"),
  validateParams(phaseParamSchema),
  getLeaderboard,
);
router.get(
  "/results-standings/:phase",
  authenticateAdmin,
  requireCapability("results.submit"),
  validateParams(phaseParamSchema),
  getResultsStandings,
);
router.get(
  "/finalize-status/:phase",
  authenticateAdmin,
  requireCapability("judging.access"),
  validateParams(phaseParamSchema),
  getFinalizeStatus,
);
router.post(
  "/results/:phase",
  authenticateAdmin,
  requireCapability("results.submit"),
  validateParams(phaseParamSchema),
  validate(passedIdsSchema),
  submitResults,
);
router.post(
  "/results/:phase/and-close",
  authenticateAdmin,
  requireCapability("results.submitAnytime"),
  validateParams(phaseParamSchema),
  validate(passedIdsSchema),
  submitResultsAndClose,
);

export default router;
