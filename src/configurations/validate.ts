import { Request, Response, NextFunction } from "express";
import Joi from "joi";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      // Express 5's `req.query` is a getter-only property that re-parses
      // `req.url` on every access — it can't be reassigned, so a validated
      // query goes here instead. Controllers behind `validateQuery` read
      // from this, not `req.query`.
      validatedQuery?: Record<string, any>;
    }
  }
}

const respondWithErrors = (response: Response, error: Joi.ValidationError) => {
  const errorMessages = error.details.map((detail) => detail.message.replace(/["\\]/g, ""));

  return response.status(400).json({
    status: "error",
    message: errorMessages[0],
    errors: errorMessages,
  });
};

// NUL bytes make Postgres reject the whole statement (a 500 an attacker can
// trigger at will); other C0/C1 control characters have no place in form
// input and enable log/terminal/email-header tricks. Tab and newline stay.
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;

const stripControlChars = (value: unknown): unknown => {
  if (typeof value === "string") return value.replace(CONTROL_CHARS, "");
  if (Array.isArray(value)) return value.map(stripControlChars);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) => [key, stripControlChars(inner)]),
    );
  }
  return value;
};

const validate = (schema: Joi.Schema) => {
  return (request: Request, response: Response, next: NextFunction): any => {
    const { error, value } = schema.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    
    if (error) {
      return respondWithErrors(response, error);
    }

    request.body = value;
    return next();
  };
};

/** Same as `validate`, but validates `req.query` instead of `req.body`. */
export const validateQuery = (schema: Joi.Schema) => {
  return (request: Request, response: Response, next: NextFunction): any => {
    const { error, value } = schema.validate(stripControlChars(request.query), {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return respondWithErrors(response, error);
    }

    request.validatedQuery = value;
    return next();
  };
};

/** Same as `validate`, but validates `req.params` (e.g. a route's `:id`). */
export const validateParams = (schema: Joi.Schema) => {
  return (request: Request, response: Response, next: NextFunction): any => {
    const { error, value } = schema.validate(request.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return respondWithErrors(response, error);
    }

    request.params = value;
    return next();
  };
};

export default validate;
