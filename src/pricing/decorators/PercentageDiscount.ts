import { DiscountDecorator } from './DiscountDecorator';
import type { PricingContext, PricingResult } from '../strategies/PricingStrategy';

export class PercentageDiscount extends DiscountDecorator {
  private percentage: number;

  constructor(wrappedPricing: DiscountDecorator | PricingResult | null, percentage: number) {
    super(wrappedPricing);
    this.percentage = percentage;
  }

  apply(priceResult: PricingResult, context: PricingContext): PricingResult {
    const base = this.getBaseResult(priceResult, context);
    const discountAmount = Math.round(base.price * (this.percentage / 100) * 100) / 100;
    return {
      price: Math.max(0, Math.round((base.price - discountAmount) * 100) / 100),
      discountAmount,
      discountType: 'percentage',
      discountValue: this.percentage,
      appliedBy: 'PercentageDiscount',
    };
  }

  private getBaseResult(priceResult: PricingResult, context: PricingContext): PricingResult {
    if (this.wrappedPricing instanceof DiscountDecorator) {
      return this.wrappedPricing.apply(priceResult, context);
    }
    return priceResult;
  }
}
