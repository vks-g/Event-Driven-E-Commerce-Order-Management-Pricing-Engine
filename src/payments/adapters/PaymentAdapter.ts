export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  refundId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  provider?: string;
}

export abstract class PaymentAdapter {
  protected config: Record<string, unknown>;

  constructor(config: Record<string, unknown> = {}) {
    this.config = config;
  }

  abstract processPayment(amount: number, currency: string, metadata: Record<string, unknown>): Promise<PaymentResult>;
  abstract refundPayment(paymentId: string, amount: number): Promise<PaymentResult>;
  abstract getPaymentStatus(paymentId: string): Promise<PaymentResult>;
}
