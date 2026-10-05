import { Request, Response, NextFunction } from "express";
import axios from "axios";
import configurations from ".";

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const VERIFY_TIMEOUT_MS = 5_000;
// reCAPTCHA tokens are a few KB at most; refuse anything absurd before
// forwarding it to Google.
const MAX_TOKEN_LENGTH = 4096;

const reject = (response: Response, statusCode: number, message: string) =>
  response.status(statusCode).json({ status: "error", message });

/**
 * Verifies the Google reCAPTCHA v2 token the frontend sends as
 * `captchaToken` in the JSON body. Mount it BEFORE `validate(...)` (whose
 * stripUnknown removes the field) and after the rate limiter, so floods are
 * throttled before they cost an outbound call.
 *
 * Fails closed: a missing secret, a Google outage or a bad token all block
 * the request — except outside production when no secret is configured, so
 * local development isn't blocked.
 */
const verifyCaptcha = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<any> => {
  const secret = configurations.CAPTCHA_SECRET_KEY;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("❌ CAPTCHA_SECRET_KEY is not set — rejecting request");
      return reject(response, 503, "Verification is temporarily unavailable");
    }
    return next();
  }

  const token = request.body?.captchaToken;
  if (typeof token !== "string" || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    return reject(response, 400, "Please complete the captcha");
  }

  try {
    const { data } = await axios.post(
      VERIFY_URL,
      new URLSearchParams({ secret, response: token, remoteip: request.ip ?? "" }),
      { timeout: VERIFY_TIMEOUT_MS },
    );

    if (!data?.success) {
      return reject(response, 400, "Captcha verification failed. Please try again.");
    }
    return next();
  } catch (error: any) {
    console.error("reCAPTCHA verification error:", error.message);
    return reject(response, 503, "Verification is temporarily unavailable. Please try again.");
  }
};

export default verifyCaptcha;
