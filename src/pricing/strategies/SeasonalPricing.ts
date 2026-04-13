import { PricingStrategy } from './PricingStrategy';
import type { PricingContext, PricingResult } from './PricingStrategy';

const SEASON_MULTIPLIERS: Record<string, number> = {
  summer: 1.15,
  winter: 1.10,
  spring: 1.05,
  fall: 1.05,
  holiday: 1.25,
};

export class SeasonalPricing extends PricingStrategy {
  calculatePrice(basePrice: number, context: PricingContext): PricingResult {
    const season = context.season || 'regular';
    const multiplier = SEASON_MULTIPLIERS[season as string] || 1.0;
    return {
      price: Math.round(basePrice * multiplier * 100) / 100,
      strategy: 'SeasonalPricing',
      season: season as string,
      multiplier,
    };
  }
}
