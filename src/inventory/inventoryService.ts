import inventoryRepository from './inventoryRepository';
import type { IInventory } from './inventoryModel';
import logger from '../utils/logger';

class InventoryService {
  async addProduct(productData: Partial<IInventory>): Promise<IInventory> {
    return inventoryRepository.addProduct(productData);
  }

  async getProduct(sku: string): Promise<IInventory> {
    const product = await inventoryRepository.findBySku(sku);
    if (!product) {
      const err = new Error(`Product with SKU ${sku} not found`);
      (err as Error & { statusCode?: number }).statusCode = 404;
      throw err;
    }
    return product;
  }

  async listProducts(): Promise<IInventory[]> {
    return inventoryRepository.findAll();
  }

  async reserveStock(sku: string, qty: number): Promise<IInventory> {
    const product = await this.getProduct(sku);
    const available = product.stock - product.reservedStock;

    if (available < qty) {
      const err = new Error(`Insufficient stock for ${sku}. Available: ${available}, Requested: ${qty}`);
      (err as Error & { statusCode?: number }).statusCode = 409;
      throw err;
    }

    const success = await inventoryRepository.updateStock(sku, 0, qty, product.version);
    if (!success) {
      const err = new Error('Concurrency conflict: stock was modified. Please retry.');
      (err as Error & { statusCode?: number }).statusCode = 409;
      throw err;
    }

    logger.info(`Stock reserved: ${sku}, qty: ${qty}`);
    return this.getProduct(sku);
  }

  async releaseStock(sku: string, qty: number): Promise<IInventory> {
    const product = await this.getProduct(sku);
    const releaseQty = Math.min(qty, product.reservedStock);
    const success = await inventoryRepository.updateStock(sku, releaseQty, -releaseQty, product.version);
    if (!success) {
      const err = new Error('Concurrency conflict: stock was modified. Please retry.');
      (err as Error & { statusCode?: number }).statusCode = 409;
      throw err;
    }

    logger.info(`Stock released: ${sku}, qty: ${releaseQty}`);
    return this.getProduct(sku);
  }

  async updateProductStock(sku: string, stock: number): Promise<IInventory> {
    const product = await inventoryRepository.updateProduct(sku, { stock });
    if (!product) {
      const err = new Error(`Product with SKU ${sku} not found`);
      (err as Error & { statusCode?: number }).statusCode = 404;
      throw err;
    }
    return product;
  }
}

export default new InventoryService();
