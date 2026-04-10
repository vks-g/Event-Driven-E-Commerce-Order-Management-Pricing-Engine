import { DiscountDecorator } from './DiscountDecorator';
import type { PricingContext, PricingResult } from '../strategies/PricingStrategy';

const LOYALTY_DISCOUNTS: Record<string, number> = {
  bronze: 3,
  silver: 5,
  gold: 10,
  platinum: 15,
  diamond: 20,
};

export class LoyaltyDiscount extends DiscountDecorator {
  constructor(wrappedPricing: DiscountDecorator | PricingResult | null) {
    super(wrappedPricing);
  }

  apply(priceResult: PricingResult, context: PricingContext): PricingResult {
    const base = this.getBaseResult(priceResult, context);
    const tier = context.loyaltyTier || 'none';
    const percentage = LOYALTY_DISCOUNTS[String(tier)] || 0;

    if (percentage === 0) {
      return {
        ...base,
        appliedBy: 'LoyaltyDiscount',
        loyaltyApplied: false,
        loyaltyTier: String(tier),
      };
    }

    const discountAmount = Math.round(base.price * (percentage / 100) * 100) / 100;
    return {
      price: Math.max(0, Math.round((base.price - discountAmount) * 100) / 100),
      discountAmount,
      discountType: 'loyalty',
      discountValue: percentage,
      appliedBy: 'LoyaltyDiscount',
      loyaltyApplied: true,
      loyaltyTier: String(tier),
    };
  }

  private getBaseResult(priceResult: PricingResult, context: PricingContext): PricingResult {
    if (this.wrappedPricing instanceof DiscountDecorator) {
      return this.wrappedPricing.apply(priceResult, context);
    }
    return priceResult;
  }
}
