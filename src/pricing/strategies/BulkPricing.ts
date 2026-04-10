import { PricingStrategy } from './PricingStrategy';
import type { PricingContext, PricingResult } from './PricingStrategy';

const BULK_TIERS = [
  { minQty: 100, discount: 0.25 },
  { minQty: 50, discount: 0.15 },
  { minQty: 10, discount: 0.05 },
];

export class BulkPricing extends PricingStrategy {
  calculatePrice(basePrice: number, context: PricingContext): PricingResult {
    const quantity = context.quantity || 1;
    let discount = 0;

    for (const tier of BULK_TIERS) {
      if (quantity >= tier.minQty) {
        discount = tier.discount;
        break;
      }
    }

    const discountedPrice = basePrice * (1 - discount);
    return {
      price: Math.round(discountedPrice * 100) / 100,
      strategy: 'BulkPricing',
      discount,
      quantity,
    };
  }
}
