import express from "express";
import Joi from "joi";
import { validateParams } from "../../configurations/validate";
import validate from "../../configurations/validate";
import authenticateAdmin from "../middleware/authenticate-admin";
import requireCapability from "../middleware/require-capability";
import { MessageStatus } from "../../messages/Message";
import list from "./controllers/list";
import getOne from "./controllers/get-one";
import reply from "./controllers/reply";
import resendReplyEmail from "./controllers/resend-reply-email";
import updateStatus from "./controllers/update-status";
import reassign from "./controllers/reassign";

const router = express.Router();

const idParamSchema = Joi.object({ id: Joi.string().uuid().required() });
const replyIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
  replyId: Joi.string().uuid().required(),
});
const replySchema = Joi.object({ body: Joi.string().trim().min(1).max(5000).required() });
const statusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(MessageStatus))
    .required(),
});
const reassignSchema = Joi.object({ assignedToId: Joi.string().uuid().required() });

router.get("/", authenticateAdmin, requireCapability("complaints.view"), list);
router.get(
  "/:id",
  authenticateAdmin,
  requireCapability("complaints.view"),
  validateParams(idParamSchema),
  getOne,
);
router.post(
  "/:id/reply",
  authenticateAdmin,
  requireCapability("complaints.respond"),
  validateParams(idParamSchema),
  validate(replySchema),
  reply,
);
router.post(
  "/:id/replies/:replyId/resend-email",
  authenticateAdmin,
  requireCapability("complaints.respond"),
  validateParams(replyIdParamSchema),
  resendReplyEmail,
);
router.patch(
  "/:id/status",
  authenticateAdmin,
  requireCapability("complaints.respond"),
  validateParams(idParamSchema),
  validate(statusSchema),
  updateStatus,
);
router.patch(
  "/:id/reassign",
  authenticateAdmin,
  requireCapability("complaints.reassign"),
  validateParams(idParamSchema),
  validate(reassignSchema),
  reassign,
);

export default router;
