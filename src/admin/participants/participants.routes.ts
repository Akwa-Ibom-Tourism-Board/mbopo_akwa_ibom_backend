import express from "express";
import Joi from "joi";
import { validateParams } from "../../configurations/validate";
import authenticateAdmin from "../middleware/authenticate-admin";
import requireCapability from "../middleware/require-capability";
import getOne from "./controllers/get-one";

const router = express.Router();

const idParamSchema = Joi.object({ id: Joi.string().uuid().required() });

// GET-only: the unified Participants detail view is read-only here. Every
// action that mutates something (edit details, upload documents, retry VIN,
// disable/delete the account) still goes through its original route —
// /admin/contestants/:applicationId/... or /admin/applicants/:userId/...
// — the frontend just has to use the right id for each (see
// serializeCandidateForViewer's id vs applicantId).
router.get(
  "/:id",
  authenticateAdmin,
  requireCapability("participants.view"),
  validateParams(idParamSchema),
  getOne,
);

export default router;
