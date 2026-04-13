import express from 'express';
import Joi from 'joi';
import * as inventoryController from './inventoryController';
import validateRequest from '../middleware/validateRequest';

const router = express.Router();

const productSchema = Joi.object({
  name: Joi.string().required(),
  sku: Joi.string().required(),
  basePrice: Joi.number().min(0).required(),
  category: Joi.string(),
  stock: Joi.number().min(0).default(0),
});

const stockUpdateSchema = Joi.object({
  stock: Joi.number().min(0).required(),
});

router.get('/', inventoryController.listProducts);
router.get('/:sku', inventoryController.getProduct);
router.post('/', validateRequest(productSchema), inventoryController.addProduct);
router.patch('/:sku/stock', validateRequest(stockUpdateSchema), inventoryController.updateStock);

export default router;
