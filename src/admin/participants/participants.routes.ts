import express from "express";
import Joi from "joi";
import { validateParams } from "../../configurations/validate";
import validate from "../../configurations/validate";
import authenticateAdmin from "../middleware/authenticate-admin";
import requireCapability from "../middleware/require-capability";
import { validateQuery } from "../../configurations/validate";
import getOne from "./controllers/get-one";
import message from "./controllers/message";
import getParticipantsCounts from "./controllers/get-all-count";
import getContacts from "./controllers/contacts";
import exportParticipants from "./controllers/export";

const router = express.Router();

const idParamSchema = Joi.object({ id: Joi.string().uuid().required() });
const messageSchema = Joi.object({
  subject: Joi.string().trim().min(1).max(200).required(),
  body: Joi.string().trim().min(1).max(5000).required(),
});
const contactsQuerySchema = Joi.object({
  status: Joi.string().valid("not_started", "in_progress", "submitted").optional(),
  step: Joi.number().integer().min(1).max(5).optional(),
});
const exportQuerySchema = Joi.object({
  status: Joi.string().valid("not_started", "in_progress", "submitted").optional(),
});

router.get(
  "/counts",
  authenticateAdmin,
  requireCapability("participants.view"),
  getParticipantsCounts,
);

// Bulk contact export (copy emails/phone numbers) — gated to
// applicants.manage (Super Admin/Admin only), a stronger bar than the
// read-only participants.view every other route here uses, since this
// hands back raw PII in bulk rather than one record at a time.
router.get(
  "/contacts",
  authenticateAdmin,
  requireCapability("applicants.manage"),
  validateQuery(contactsQuerySchema),
  getContacts,
);

// Full-detail Excel download — same cohort filter and the same capability
// bar as /contacts above, just every field instead of two.
router.get(
  "/export",
  authenticateAdmin,
  requireCapability("applicants.manage"),
  validateQuery(exportQuerySchema),
  exportParticipants,
);

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
