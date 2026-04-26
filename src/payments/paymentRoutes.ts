import { Router } from 'express';
import { processPayment, refundPayment, getPaymentStatus } from './paymentController';

const router = Router();

router.post('/process', processPayment);
router.post('/:id/refund', refundPayment);
router.get('/:id/status', getPaymentStatus);

export default router;
