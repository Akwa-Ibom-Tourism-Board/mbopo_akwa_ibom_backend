import express from "express";
import Joi from "joi";
import validate, { validateQuery, validateParams } from "../configurations/validate";
import { limiter } from "../configurations/rate-limit";
import { AKWA_IBOM_LGAS } from "../configurations/constants";
import listCandidates from "./controllers/list-candidates";
import getCandidate from "./controllers/get-candidate";
import castVote from "./controllers/cast-vote";

const router = express.Router();

const idParamSchema = Joi.object({ id: Joi.string().uuid().required() });

const listQuerySchema = Joi.object({
  lga: Joi.string()
    .valid(...AKWA_IBOM_LGAS)
    .optional(),
});

const castVoteSchema = Joi.object({
  candidateId: Joi.string().uuid().required(),
  votes: Joi.number().integer().min(1).max(10_000).required(),
});

// Entirely unauthenticated — this is the public voting site's own API.
router.get("/candidates", validateQuery(listQuerySchema), listCandidates);
router.get("/candidates/:id", validateParams(idParamSchema), getCandidate);
// Stricter limiter than the blanket one in app.ts: this is the one public
// endpoint that writes anything, and — until real payment verification
// lands — has nothing else standing between it and abuse. See
// cast-vote.service.ts's own note on that gap.
router.post("/votes", limiter, validate(castVoteSchema), castVote);

export default router;
