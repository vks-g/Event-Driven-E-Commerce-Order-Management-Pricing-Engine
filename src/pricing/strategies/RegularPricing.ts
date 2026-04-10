import { PricingStrategy } from './PricingStrategy';
import type { PricingContext, PricingResult } from './PricingStrategy';

export class RegularPricing extends PricingStrategy {
  calculatePrice(basePrice: number, _context: PricingContext): PricingResult {
    return { price: basePrice, strategy: 'RegularPricing' };
  }
}
