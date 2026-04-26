import { Request, Response, NextFunction } from 'express';
import paymentService from './paymentService';
import { formatSuccess, formatError } from '../utils/responseFormatter';

export const processPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderId, amount, provider } = req.body;
    const result = await paymentService.processPayment(orderId, amount, provider);
    res.status(200).json(formatSuccess(result, 'Payment processed successfully'));
  } catch (err) {
    next(err);
  }
};

export const refundPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { amount, provider } = req.body;
    const result = await paymentService.refundPayment(id, amount, provider);
    res.status(200).json(formatSuccess(result, 'Refund processed successfully'));
  } catch (err) {
    next(err);
  }
};

export const getPaymentStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { provider } = req.query;
    const result = await paymentService.getPaymentStatus(id, provider as string | undefined);
    res.status(200).json(formatSuccess(result, 'Payment status retrieved'));
  } catch (err) {
    next(err);
  }
};
