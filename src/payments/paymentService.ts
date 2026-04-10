import { StripeAdapter } from './adapters/StripeAdapter';
import type { PaymentResult } from './adapters/PaymentAdapter';
import logger from '../utils/logger';

class PaymentService {
  private adapters: Record<string, StripeAdapter>;
  private defaultAdapter = 'stripe';

  constructor() {
    this.adapters = {
      stripe: new StripeAdapter(),
    };
  }

  async processPayment(orderId: string, amount: number, provider = this.defaultAdapter): Promise<PaymentResult> {
    const adapter = this.adapters[provider];
    if (!adapter) {
      const err = new Error(`Payment provider ${provider} not supported`);
      (err as Error & { statusCode?: number }).statusCode = 400;
      throw err;
    }
    return adapter.processPayment(amount, 'USD', { orderId });
  }

  async refundPayment(paymentId: string, amount: number, provider = this.defaultAdapter): Promise<PaymentResult> {
    const adapter = this.adapters[provider];
    if (!adapter) {
      const err = new Error(`Payment provider ${provider} not supported`);
      (err as Error & { statusCode?: number }).statusCode = 400;
      throw err;
    }
    return adapter.refundPayment(paymentId, amount);
  }

  async getPaymentStatus(paymentId: string, provider = this.defaultAdapter): Promise<PaymentResult> {
    const adapter = this.adapters[provider];
    if (!adapter) {
      const err = new Error(`Payment provider ${provider} not supported`);
      (err as Error & { statusCode?: number }).statusCode = 400;
      throw err;
    }
    return adapter.getPaymentStatus(paymentId);
  }
}

export default new PaymentService();
