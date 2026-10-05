import Joi from "joi";

// Letters (any script), combining marks, spaces, apostrophes, hyphens, dots:
// no angle brackets or other markup can be stored in a name.
export const personNameSchema = Joi.string()
  .trim()
  .min(1)
  .max(100)
  .pattern(/^[\p{L}\p{M}][\p{L}\p{M}' .-]*$/u)
  .messages({ "string.pattern.base": "Name contains invalid characters" });
