import { Request, Response, NextFunction } from 'express';
import paymentService from './paymentService';
import { formatSuccess } from '../utils/responseFormatter';

export const processPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orderId = req.body.orderId as string;
    const amount = req.body.amount as number;
    const provider = req.body.provider as string | undefined;
    const result = await paymentService.processPayment(orderId, amount, provider);
    res.status(200).json(formatSuccess(result, 'Payment processed successfully'));
  } catch (err) {
    next(err);
  }
};

export const refundPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const amount = req.body.amount as number;
    const provider = req.body.provider as string | undefined;
    const result = await paymentService.refundPayment(id, amount, provider);
    res.status(200).json(formatSuccess(result, 'Refund processed successfully'));
  } catch (err) {
    next(err);
  }
};

export const getPaymentStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const providerRaw = req.query.provider;
    const provider: string | undefined = typeof providerRaw === 'string' ? providerRaw : undefined;
    const result = await paymentService.getPaymentStatus(id, provider);
    res.status(200).json(formatSuccess(result, 'Payment status retrieved'));
  } catch (err) {
    next(err);
  }
};
