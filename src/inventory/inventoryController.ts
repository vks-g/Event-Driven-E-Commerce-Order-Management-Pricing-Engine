import type { Request, Response, NextFunction } from 'express';
import inventoryService from './inventoryService';
import { formatSuccess } from '../utils/responseFormatter';

export const addProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await inventoryService.addProduct(req.validatedBody || req.body);
    res.status(201).json(formatSuccess(product, 'Product added', 201));
  } catch (err) {
    next(err);
  }
};

export const getProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await inventoryService.getProduct(req.params.sku as string);
    res.json(formatSuccess(product));
  } catch (err) {
    next(err);
  }
};

export const listProducts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const products = await inventoryService.listProducts();
    res.json(formatSuccess(products));
  } catch (err) {
    next(err);
  }
};

export const updateStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { stock } = req.validatedBody || req.body;
    const product = await inventoryService.updateProductStock(req.params.sku as string, stock as number);
    res.json(formatSuccess(product, 'Stock updated'));
  } catch (err) {
    next(err);
  }
};
