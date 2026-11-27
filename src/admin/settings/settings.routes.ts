import express from "express";
import Joi from "joi";
import validate from "../../configurations/validate";
import authenticateAdmin from "../middleware/authenticate-admin";
import requireCapability from "../middleware/require-capability";
import { RegistrationStatus } from "../../registration/RegistrationSetting";
import getRegistrationStatus from "./controllers/get-registration-status";
import updateRegistrationStatus from "./controllers/update-registration-status";

const router = express.Router();

const updateRegistrationStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(RegistrationStatus))
    .required(),
});

// Only Admin/Super Admin may see or change this — every other role has no
// reason to know, and closing registration is a platform-wide decision.
router.get(
  "/registration",
  authenticateAdmin,
  requireCapability("registration.manage"),
  getRegistrationStatus,
);
router.patch(
  "/registration",
  authenticateAdmin,
  requireCapability("registration.manage"),
  validate(updateRegistrationStatusSchema),
  updateRegistrationStatus,
);

export default router;
