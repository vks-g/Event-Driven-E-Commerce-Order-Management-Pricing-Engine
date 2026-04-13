import orderService from '../../orders/orderService';
import EventBus from '../../events/EventBus';
import { EVENTS } from '../../utils/constants';
import logger from '../../utils/logger';

const bus = EventBus.getInstance();

export const handleInventoryReserved = async (payload: Record<string, unknown>): Promise<void> => {
  logger.info(`OrderHandler: Processing INVENTORY_RESERVED for order ${payload.orderId}`);

  try {
    await orderService.confirmOrder(payload.orderId as string);
    bus.emit(EVENTS.ORDER_CONFIRMED, { orderId: payload.orderId });
    logger.info(`Order ${payload.orderId} auto-confirmed after inventory reservation`);
  } catch (err) {
    logger.error(`OrderHandler: Failed to confirm order ${payload.orderId}: ${(err as Error).message}`);
  }
};

export const registerHandlers = (): void => {
  bus.on(EVENTS.INVENTORY_RESERVED, handleInventoryReserved);
  logger.info('Order event handlers registered');
};
