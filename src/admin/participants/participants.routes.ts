import express from "express";
import Joi from "joi";
import { validateParams } from "../../configurations/validate";
import validate from "../../configurations/validate";
import authenticateAdmin from "../middleware/authenticate-admin";
import requireCapability from "../middleware/require-capability";
import getOne from "./controllers/get-one";
import message from "./controllers/message";

const router = express.Router();

const idParamSchema = Joi.object({ id: Joi.string().uuid().required() });
const messageSchema = Joi.object({
  subject: Joi.string().trim().min(1).max(200).required(),
  body: Joi.string().trim().min(1).max(5000).required(),
});

// The unified Participants detail view is read-only here, except for
// starting a direct message thread. Every other action that mutates
// something (edit details, upload documents, retry VIN, disable/delete the
// account) still goes through its original route —
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
router.post(
  "/:id/messages",
  authenticateAdmin,
  requireCapability("participants.message"),
  validateParams(idParamSchema),
  validate(messageSchema),
  message,
);

export default router;
