import express from 'express';
import * as pricingController from './pricingController';

const router = express.Router();

router.post('/calculate', pricingController.calculateCartPrice);
router.post('/simulate', pricingController.simulateStrategies);
router.get('/strategies', pricingController.getStrategies);

export default router;
