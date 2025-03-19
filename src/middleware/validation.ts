import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { ValidationError } from "joi";

import { JoiValidationError } from "@/lib/errors";

export const customJoi = {
  id: () => Joi.string().hex().length(24).required(),
  optionalString: () => Joi.string().allow("").allow(null),
  optionalDate: () => Joi.date().allow("").allow(null)
};

export function validateJoiSchema(value: any, schema: Joi.ObjectSchema) {
  try {
    Joi.assert(value, schema);
  } catch (err) {
    if (err instanceof ValidationError) {
      throw new JoiValidationError(err.details);
    } else {
      throw err;
    }
  }
}

export function bodySchema(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    validateJoiSchema(req.body, schema);
    next();
  };
}

export function querySchema(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    validateJoiSchema(req.query, schema);
    next();
  };
}

export function paramSchema(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    validateJoiSchema(req.params, schema);
    next();
  };
}
