import express from 'express';
import { formatError } from '../utils/responseFormatter';

const router = express.Router();

router.post('/process', (_req, res) => {
  res.status(501).json(formatError(new Error('Payment processing not yet implemented'), 'Not Implemented', 501));
});

router.post('/:paymentId/refund', (_req, res) => {
  res.status(501).json(formatError(new Error('Payment refund not yet implemented'), 'Not Implemented', 501));
});

router.get('/:paymentId/status', (_req, res) => {
  res.status(501).json(formatError(new Error('Payment status check not yet implemented'), 'Not Implemented', 501));
});

export default router;
