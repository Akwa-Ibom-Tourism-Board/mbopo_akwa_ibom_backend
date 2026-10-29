import express from "express";
import Joi from "joi";
import validate from "../../configurations/validate";
import { limiter } from "../../configurations/rate-limit";
import authenticateAdmin from "../middleware/authenticate-admin";
import login from "./controllers/login";
import me from "./controllers/me";
import changePassword from "./controllers/change-password";
import logout from "./controllers/logout";

const router = express.Router();

const loginSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().max(254).required(),
  password: Joi.string().min(1).max(128).required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(1).max(128).required(),
  newPassword: Joi.string().min(8).max(128).required().messages({
    "string.min": "New password must be at least 8 characters",
  }),
});

router.post("/login", limiter, validate(loginSchema), login);
router.get("/me", authenticateAdmin, me);
router.post(
  "/change-password",
  authenticateAdmin,
  validate(changePasswordSchema),
  changePassword,
);
router.post("/logout", authenticateAdmin, logout);

export default router;
