import type { Request, Response, NextFunction } from 'express';
import IdempotencyKey from '../orders/idempotencyModel';
import logger from '../utils/logger';

const idempotencyMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

  if (!idempotencyKey) {
    next();
    return;
  }

  try {
    const existing = await IdempotencyKey.findOne({ key: idempotencyKey });

    if (existing) {
      logger.info(`Idempotency: Returning cached response for key: ${idempotencyKey}`);
      res.status(existing.statusCode).json(existing.response);
      return;
    }

    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      IdempotencyKey.create({
        key: idempotencyKey,
        response: body,
        statusCode: res.statusCode,
      }).catch((err: Error) => logger.error(`Failed to cache idempotency key: ${err.message}`));

      return originalJson(body);
    };

    next();
  } catch (err) {
    logger.error(`Idempotency middleware error: ${(err as Error).message}`);
    next();
  }
};

export default idempotencyMiddleware;
