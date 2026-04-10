import type { PricingContext, PricingResult } from '../strategies/PricingStrategy';

export abstract class DiscountDecorator {
  wrappedPricing: DiscountDecorator | PricingResult | null;

  constructor(wrappedPricing: DiscountDecorator | PricingResult | null) {
    this.wrappedPricing = wrappedPricing;
  }

  abstract apply(priceResult: PricingResult, context: PricingContext): PricingResult;
}
