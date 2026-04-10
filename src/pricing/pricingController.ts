import type { Request, Response, NextFunction } from 'express';
import pricingService from './pricingService';
import { formatSuccess, formatError } from '../utils/responseFormatter';

export const calculateCartPrice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { items, strategy, discounts, context } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json(formatError(new Error('Items array is required'), 'Validation Error', 400));
      return;
    }

    const result = pricingService.calculateCartPrice(items, strategy, discounts, context);
    res.json(formatSuccess(result));
  } catch (err) {
    next(err);
  }
};

export const simulateStrategies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { items, context } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json(formatError(new Error('Items array is required'), 'Validation Error', 400));
      return;
    }

    const result = pricingService.simulateStrategies(items, context);
    res.json(formatSuccess(result));
  } catch (err) {
    next(err);
  }
};

export const getStrategies = (_req: Request, res: Response): void => {
  const strategies = pricingService.getAvailableStrategies();
  res.json(formatSuccess(strategies));
};
