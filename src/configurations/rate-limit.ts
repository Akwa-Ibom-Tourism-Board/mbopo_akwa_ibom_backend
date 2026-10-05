import rateLimit from "express-rate-limit";

export const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

export const otpResendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1,
  message: "Too many requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

// Blanket ceiling for every API route; the stricter limiters above stack on
// top of it for sensitive endpoints.
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: "Too many requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});
