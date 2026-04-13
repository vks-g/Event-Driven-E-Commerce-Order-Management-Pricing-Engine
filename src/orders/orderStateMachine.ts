import { ORDER_STATUSES, type OrderStatusType } from '../utils/constants';

const transitions: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PAYMENT_PROCESSING', 'CANCELLED'],
  PAYMENT_PROCESSING: ['PAID', 'PAYMENT_FAILED'],
  PAID: ['SHIPPING', 'REFUNDED'],
  SHIPPING: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  CANCELLED: [],
  PAYMENT_FAILED: ['PENDING', 'CANCELLED'],
  DELIVERED: [],
  REFUNDED: [],
};

class OrderStateMachine {
  static isValidTransition(fromStatus: string, toStatus: string): boolean {
    const allowedTransitions = transitions[fromStatus];
    if (!allowedTransitions) return false;
    return allowedTransitions.includes(toStatus);
  }

  static transition(currentStatus: string, newStatus: string): string {
    if (currentStatus === newStatus) return newStatus;

    if (!this.isValidTransition(currentStatus, newStatus)) {
      const err = new Error(
        `Invalid transition from ${currentStatus} to ${newStatus}. Allowed: ${transitions[currentStatus]?.join(', ') || 'none'}`
      );
      (err as Error & { statusCode?: number }).statusCode = 400;
      throw err;
    }

    return newStatus;
  }

  static getAvailableTransitions(status: string): string[] {
    return transitions[status] || [];
  }

  static getAllStatuses(): string[] {
    return Object.keys(ORDER_STATUSES);
  }
}

export default OrderStateMachine;
