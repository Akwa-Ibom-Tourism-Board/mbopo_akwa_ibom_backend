import express from "express";
import Joi from "joi";
import validate from "../../configurations/validate";
import authenticateAdmin from "../middleware/authenticate-admin";
import requireCapability from "../middleware/require-capability";
import { AdminRole } from "./AdminUser";
import list from "./controllers/list";
import create from "./controllers/create";
import createBulk from "./controllers/create-bulk";
import update from "./controllers/update";
import setActive from "./controllers/set-active";
import resetPassword from "./controllers/reset-password";

const router = express.Router();

// "super_admin" deliberately excluded — the same rule is enforced again,
// independently, in admin/helpers/admin-users.helpers.ts's assertAssignable(). This is
// just a clearer 400 instead of a 403 when someone tries anyway.
const ASSIGNABLE_ROLE_VALUES = Object.values(AdminRole).filter(
  (role) => role !== AdminRole.SuperAdmin,
);

const newUserSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(100).required(),
  lastName: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().trim().email().lowercase().max(254).required(),
  role: Joi.string()
    .valid(...ASSIGNABLE_ROLE_VALUES)
    .required(),
});

const createBulkSchema = Joi.object({
  users: Joi.array().items(newUserSchema).min(1).max(200).required(),
});

const updateSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(100).optional(),
  lastName: Joi.string().trim().min(1).max(100).optional(),
  email: Joi.string().trim().email().lowercase().max(254).optional(),
  role: Joi.string()
    .valid(...ASSIGNABLE_ROLE_VALUES)
    .optional(),
});

const setActiveSchema = Joi.object({
  active: Joi.boolean().required(),
});

router.get("/", authenticateAdmin, requireCapability("users.manage"), list);
router.post(
  "/",
  authenticateAdmin,
  requireCapability("users.manage"),
  validate(newUserSchema),
  create,
);
router.post(
  "/bulk",
  authenticateAdmin,
  requireCapability("users.manage"),
  validate(createBulkSchema),
  createBulk,
);
router.patch(
  "/:id",
  authenticateAdmin,
  requireCapability("users.manage"),
  validate(updateSchema),
  update,
);
router.patch(
  "/:id/active",
  authenticateAdmin,
  requireCapability("users.manage"),
  validate(setActiveSchema),
  setActive,
);
router.post(
  "/:id/reset-password",
  authenticateAdmin,
  requireCapability("users.manage"),
  resetPassword,
);

export default router;
