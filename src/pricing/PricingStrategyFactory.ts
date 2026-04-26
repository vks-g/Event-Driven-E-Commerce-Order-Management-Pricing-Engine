import { RegularPricing } from './strategies/RegularPricing';
import { SeasonalPricing } from './strategies/SeasonalPricing';
import { BulkPricing } from './strategies/BulkPricing';
import { MemberPricing } from './strategies/MemberPricing';
import type { PricingStrategy } from './strategies/PricingStrategy';

const STRATEGY_MAP: Record<string, new () => PricingStrategy> = {
  RegularPricing,
  SeasonalPricing,
  BulkPricing,
  MemberPricing,
};

export class PricingStrategyFactory {
  static create(strategyName: string): PricingStrategy {
    const StrategyClass = STRATEGY_MAP[strategyName];
    if (!StrategyClass) {
      return new RegularPricing();
    }
    return new StrategyClass();
  }

  static getAvailableStrategies(): string[] {
    return Object.keys(STRATEGY_MAP);
  }
}
