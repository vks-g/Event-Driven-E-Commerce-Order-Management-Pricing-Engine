import { PricingStrategy } from './PricingStrategy';
import type { PricingContext, PricingResult } from './PricingStrategy';

const MEMBER_DISCOUNTS: Record<string, number> = {
  silver: 0.05,
  gold: 0.10,
  platinum: 0.15,
};

export class MemberPricing extends PricingStrategy {
  calculatePrice(basePrice: number, context: PricingContext): PricingResult {
    const tier = context.memberTier || 'regular';
    const discount = MEMBER_DISCOUNTS[tier as string] || 0;
    const discountedPrice = basePrice * (1 - discount);
    return {
      price: Math.round(discountedPrice * 100) / 100,
      strategy: 'MemberPricing',
      memberTier: tier as string,
      discount,
    };
  }
}
