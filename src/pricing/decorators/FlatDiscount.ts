import { DiscountDecorator } from './DiscountDecorator';
import type { PricingContext, PricingResult } from '../strategies/PricingStrategy';

export class FlatDiscount extends DiscountDecorator {
  private amount: number;

  constructor(wrappedPricing: DiscountDecorator | PricingResult | null, amount: number) {
    super(wrappedPricing);
    this.amount = amount;
  }

  apply(priceResult: PricingResult, context: PricingContext): PricingResult {
    const base = this.getBaseResult(priceResult, context);
    return {
      price: Math.max(0, Math.round((base.price - this.amount) * 100) / 100),
      discountAmount: Math.min(this.amount, base.price),
      discountType: 'flat',
      discountValue: this.amount,
      appliedBy: 'FlatDiscount',
    };
  }

  private getBaseResult(priceResult: PricingResult, context: PricingContext): PricingResult {
    if (this.wrappedPricing instanceof DiscountDecorator) {
      return this.wrappedPricing.apply(priceResult, context);
    }
    return priceResult;
  }
}
