import type { Request, Response, NextFunction } from 'express';
import type { ObjectSchema } from 'joi';
import { formatError } from '../utils/responseFormatter';

const validateRequest = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const source = req.method === 'GET' ? req.query : req.body;
    const { error, value } = schema.validate(source, { abortEarly: false });

    if (error) {
      const details = error.details.map((d) => d.message);
      res.status(400).json(formatError(new Error(details.join(', ')), 'Validation Error', 400));
      return;
    }

    req.validatedBody = value;
    next();
  };
};

export default validateRequest;
