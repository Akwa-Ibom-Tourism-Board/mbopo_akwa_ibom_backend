import { Request, Response, NextFunction } from "express";
import { getRegistrationStatus } from "./registration.helpers";
import { RegistrationStatus } from "./RegistrationSetting";

/**
 * Blocks brand-new sign-ups (POST /auth/register) whenever registration
 * isn't fully open — both "new_intake_closed" and "closed" stop new
 * accounts; only an existing account may still do anything from here on.
 */
export const requireRegistrationOpenForSignup = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<any> => {
  const status = await getRegistrationStatus();
  if (status !== RegistrationStatus.Open) {
    return response.status(403).json({
      status: "error",
      message:
        "Registration has closed. If you already have an account, you can still log in.",
    });
  }
  return next();
};

/**
 * Blocks an existing applicant from continuing (identity verification,
 * draft edits, photo/document uploads, submit) only once registration is
 * fully "closed" — while it's merely "new_intake_closed", someone who
 * already has an account may keep going right through to submission.
 */
export const requireRegistrationOpenForContinuing = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<any> => {
  const status = await getRegistrationStatus();
  if (status === RegistrationStatus.Closed) {
    return response.status(403).json({
      status: "error",
      message: "Registration has closed. Applications can no longer be edited or submitted.",
    });
  }
  return next();
};
