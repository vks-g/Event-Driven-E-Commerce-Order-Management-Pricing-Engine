import orderRepository from './orderRepository';
import OrderStateMachine from './orderStateMachine';
import pricingService from '../pricing/pricingService';
import PricingService from '../pricing/pricingService';
import EventBus from '../events/EventBus';
import { EVENTS } from '../utils/constants';
import type { IOrder, IOrderItem } from './orderModel';
import type { PricingContext } from '../pricing/strategies/PricingStrategy';
import type { DiscountConfig } from '../pricing/pricingService';
import logger from '../utils/logger';

const bus = EventBus.getInstance();

interface CreateOrderParams {
  items: Array<{ sku: string; name: string; quantity: number; basePrice: number }>;
  strategy?: string;
  discounts?: DiscountConfig[];
  context?: PricingContext;
  idempotencyKey?: string;
}

class OrderService {
  private pricingService: typeof PricingService;

  constructor(pricingServiceInstance: typeof PricingService = pricingService) {
    this.pricingService = pricingServiceInstance;
  }

  async createOrder({ items, strategy, discounts, context, idempotencyKey }: CreateOrderParams): Promise<IOrder> {
    const pricingResult = this.pricingService.calculateCartPrice(items, strategy || 'RegularPricing', discounts || [], context || {});

    const orderItems: IOrderItem[] = items.map((item) => {
      const pricedItem = pricingResult.items.find((p) => p.sku === item.sku);
      return {
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        basePrice: item.basePrice,
        finalPrice: pricedItem ? pricedItem.finalPrice : item.basePrice * item.quantity,
      };
    });

    const orderData: Partial<IOrder> = {
      items: orderItems,
      status: 'PENDING',
      totalPrice: pricingResult.total,
      subtotal: pricingResult.subtotal,
      discountsApplied: pricingResult.discounts,
      pricingStrategy: strategy || 'RegularPricing',
      idempotencyKey,
    };

    const order = await orderRepository.create(orderData);

    bus.emit(EVENTS.ORDER_CREATED, {
      orderId: (order._id as mongoose.Types.ObjectId).toString(),
      items: orderItems,
    });

    logger.info(`Order created: ${order._id}, status: ${order.status}`);
    return order;
  }

  async confirmOrder(orderId: string): Promise<IOrder> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      const err = new Error(`Order ${orderId} not found`);
      (err as Error & { statusCode?: number }).statusCode = 404;
      throw err;
    }

    const newStatus = OrderStateMachine.transition(order.status, 'CONFIRMED');
    const updatedOrder = await orderRepository.findByIdAndUpdate(orderId, { status: newStatus });
    if (!updatedOrder) throw new Error('Order not found after update');

    bus.emit(EVENTS.ORDER_CONFIRMED, { orderId, status: newStatus });
    logger.info(`Order confirmed: ${orderId}`);
    return updatedOrder;
  }

  async cancelOrder(orderId: string, reason?: string): Promise<IOrder> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      const err = new Error(`Order ${orderId} not found`);
      (err as Error & { statusCode?: number }).statusCode = 404;
      throw err;
    }

    const newStatus = OrderStateMachine.transition(order.status, 'CANCELLED');
    const updatedOrder = await orderRepository.findByIdAndUpdate(orderId, { status: newStatus });
    if (!updatedOrder) throw new Error('Order not found after update');

    bus.emit(EVENTS.ORDER_CANCELLED, {
      orderId,
      items: order.items,
      reason,
    });

    logger.info(`Order cancelled: ${orderId}, reason: ${reason}`);
    return updatedOrder;
  }

  async getOrder(orderId: string): Promise<IOrder> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      const err = new Error(`Order ${orderId} not found`);
      (err as Error & { statusCode?: number }).statusCode = 404;
      throw err;
    }
    return order;
  }

  async listOrders(): Promise<IOrder[]> {
    return orderRepository.findAll();
  }

  async transitionOrder(orderId: string, newStatus: string): Promise<IOrder> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      const err = new Error(`Order ${orderId} not found`);
      (err as Error & { statusCode?: number }).statusCode = 404;
      throw err;
    }

    const status = OrderStateMachine.transition(order.status, newStatus);
    const updatedOrder = await orderRepository.findByIdAndUpdate(orderId, { status });
    if (!updatedOrder) throw new Error('Order not found after update');

    logger.info(`Order ${orderId} transitioned: ${order.status} -> ${status}`);
    return updatedOrder;
  }
}

import mongoose from 'mongoose';

export default new OrderService();
