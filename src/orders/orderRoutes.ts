import express from 'express';
import Joi from 'joi';
import * as orderController from './orderController';
import validateRequest from '../middleware/validateRequest';

const router = express.Router();

const createOrderSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        sku: Joi.string().required(),
        name: Joi.string().required(),
        quantity: Joi.number().min(1).required(),
        basePrice: Joi.number().min(0).required(),
      })
    )
    .min(1)
    .required(),
  strategy: Joi.string().valid('RegularPricing', 'SeasonalPricing', 'BulkPricing', 'MemberPricing'),
  discounts: Joi.array(),
  context: Joi.object(),
});

const transitionSchema = Joi.object({
  status: Joi.string().required(),
});

router.post('/', validateRequest(createOrderSchema), orderController.createOrder);
router.get('/', orderController.listOrders);
router.get('/transitions', orderController.getTransitions);
router.get('/:id', orderController.getOrder);
router.post('/:id/confirm', orderController.confirmOrder);
router.post('/:id/cancel', orderController.cancelOrder);
router.post('/:id/transition', validateRequest(transitionSchema), orderController.transitionOrder);

export default router;
