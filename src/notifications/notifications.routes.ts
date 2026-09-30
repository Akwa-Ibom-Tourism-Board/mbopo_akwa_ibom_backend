import express from "express";
import Joi from "joi";
import { validateQuery, validateParams } from "../configurations/validate";
import authenticate from "../configurations/authenticate";

import list from "./controllers/list";
import unreadCount from "./controllers/unread-count";
import markRead from "./controllers/mark-read";
import markAllRead from "./controllers/mark-all-read";

const router = express.Router();

const listQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50).optional(),
});

const notificationIdParamsSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.guid": "Invalid notification id",
    "any.required": "Notification id is required",
  }),
});

router.get("/", authenticate, validateQuery(listQuerySchema), list);
router.get("/unread-count", authenticate, unreadCount);
router.patch(
  "/:id/read",
  authenticate,
  validateParams(notificationIdParamsSchema),
  markRead,
);
router.patch("/read-all", authenticate, markAllRead);

export default router;
