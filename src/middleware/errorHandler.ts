import type { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { formatError } from '../utils/responseFormatter';

const errorHandler = (err: Error & { statusCode?: number }, _req: Request, res: Response, _next: NextFunction): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`Error: ${message}`, {
    statusCode,
    stack: err.stack,
  });

  res.status(statusCode).json(formatError(err, message, statusCode));
};

export default errorHandler;
