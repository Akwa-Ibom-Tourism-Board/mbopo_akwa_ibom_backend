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
    const { error, value } = schema.validate(request.query, {
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

export default validate;
