import { PaymentAdapter } from './PaymentAdapter';
import type { PaymentResult } from './PaymentAdapter';
import logger from '../../utils/logger';

export class StripeAdapter extends PaymentAdapter {
  private apiKey: string;

  constructor(config: Record<string, unknown> = {}) {
    super(config);
    this.apiKey = (config.apiKey as string) || 'sk_test_stub';
  }

  async processPayment(amount: number, currency = 'USD', metadata: Record<string, unknown> = {}): Promise<PaymentResult> {
    logger.info(`StripeAdapter: Processing payment of ${amount} ${currency}`, { metadata });

    return {
      success: true,
      paymentId: `stripe_${Date.now()}`,
      amount,
      currency,
      status: 'succeeded',
      provider: 'stripe',
    };
  }

  async refundPayment(paymentId: string, amount: number): Promise<PaymentResult> {
    logger.info(`StripeAdapter: Refunding payment ${paymentId} for ${amount}`);

    return {
      success: true,
      refundId: `refund_${Date.now()}`,
      paymentId,
      amount,
      status: 'refunded',
    };
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentResult> {
    return {
      success: true,
      paymentId,
      status: 'succeeded',
      provider: 'stripe',
    };
  }
}
