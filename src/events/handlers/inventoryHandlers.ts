import inventoryService from '../../inventory/inventoryService';
import EventBus from '../../events/EventBus';
import { EVENTS } from '../../utils/constants';
import logger from '../../utils/logger';

const bus = EventBus.getInstance();

export const handleOrderCreated = async (payload: Record<string, unknown>): Promise<void> => {
  logger.info(`InventoryHandler: Processing ORDER_CREATED for order ${payload.orderId}`);

  const { orderId, items } = payload;

  try {
    for (const item of items as Array<{ sku: string; quantity: number }>) {
      await inventoryService.reserveStock(item.sku, item.quantity);
    }
    bus.emit(EVENTS.INVENTORY_RESERVED, { orderId, items });
  } catch (err) {
    logger.error(`InventoryHandler: Failed to reserve stock for order ${orderId}: ${(err as Error).message}`);
    bus.emit(EVENTS.ORDER_CANCELLED, {
      orderId,
      reason: `Stock reservation failed: ${(err as Error).message}`,
    });
  }
};

export const handleOrderCancelled = async (payload: Record<string, unknown>): Promise<void> => {
  logger.info(`InventoryHandler: Processing ORDER_CANCELLED for order ${payload.orderId}`);

  const { orderId, items } = payload;

  try {
    for (const item of items as Array<{ sku: string; quantity: number }>) {
      await inventoryService.releaseStock(item.sku, item.quantity);
    }
    bus.emit(EVENTS.INVENTORY_RELEASED, { orderId, items });
  } catch (err) {
    logger.error(`InventoryHandler: Failed to release stock for order ${orderId}: ${(err as Error).message}`);
  }
};

export const registerHandlers = (): void => {
  bus.on(EVENTS.ORDER_CREATED, handleOrderCreated);
  bus.on(EVENTS.ORDER_CANCELLED, handleOrderCancelled);
  logger.info('Inventory event handlers registered');
};
