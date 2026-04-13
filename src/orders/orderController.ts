import type { Request, Response, NextFunction } from 'express';
import orderService from './orderService';
import OrderStateMachine from './orderStateMachine';
import { formatSuccess, formatError } from '../utils/responseFormatter';

export const createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { items, strategy, discounts, context } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json(formatError(new Error('Items array is required'), 'Validation Error', 400));
      return;
    }

    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
    const order = await orderService.createOrder({ items, strategy, discounts, context, idempotencyKey });
    res.status(201).json(formatSuccess(order, 'Order created', 201));
  } catch (err) {
    next(err);
  }
};

export const getOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await orderService.getOrder(req.params.id as string);
    res.json(formatSuccess(order));
  } catch (err) {
    next(err);
  }
};

export const listOrders = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orders = await orderService.listOrders();
    res.json(formatSuccess(orders));
  } catch (err) {
    next(err);
  }
};

export const confirmOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await orderService.confirmOrder(req.params.id as string);
    res.json(formatSuccess(order, 'Order confirmed'));
  } catch (err) {
    next(err);
  }
};

export const cancelOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { reason } = req.body;
    const order = await orderService.cancelOrder(req.params.id as string, reason);
    res.json(formatSuccess(order, 'Order cancelled'));
  } catch (err) {
    next(err);
  }
};

export const transitionOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json(formatError(new Error('Status is required'), 'Validation Error', 400));
      return;
    }
    const order = await orderService.transitionOrder(req.params.id as string, status);
    res.json(formatSuccess(order, `Order transitioned to ${status}`));
  } catch (err) {
    next(err);
  }
};

export const getTransitions = (req: Request, res: Response): void => {
  const { status } = req.query;
  if (status) {
    const transitions = OrderStateMachine.getAvailableTransitions(String(status).toUpperCase());
    res.json(formatSuccess({ status, availableTransitions: transitions }));
  } else {
    const allStatuses = OrderStateMachine.getAllStatuses();
    const statusMap: Record<string, string[]> = {};
    for (const s of allStatuses) {
      statusMap[s] = OrderStateMachine.getAvailableTransitions(s);
    }
    res.json(formatSuccess(statusMap));
  }
};
