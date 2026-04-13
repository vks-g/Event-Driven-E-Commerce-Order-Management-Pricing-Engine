import { RegularPricing } from './strategies/RegularPricing';
import { SeasonalPricing } from './strategies/SeasonalPricing';
import { BulkPricing } from './strategies/BulkPricing';
import { MemberPricing } from './strategies/MemberPricing';
import { PercentageDiscount } from './decorators/PercentageDiscount';
import { FlatDiscount } from './decorators/FlatDiscount';
import { CouponDiscount } from './decorators/CouponDiscount';
import { LoyaltyDiscount } from './decorators/LoyaltyDiscount';
import type { PricingStrategy } from './strategies/PricingStrategy';
import type { PricingContext, PricingResult } from './strategies/PricingStrategy';
import { DiscountDecorator } from './decorators/DiscountDecorator';

export interface DiscountConfig {
  type: string;
  value?: number;
}

interface CartItem {
  sku: string;
  name: string;
  quantity: number;
  basePrice: number;
}

interface ItemPricingResult {
  sku: string;
  name: string;
  quantity: number;
  basePrice: number;
  finalPrice: number;
  strategy: string;
  discounts: PricingResult[];
}

interface CartPricingResult {
  items: ItemPricingResult[];
  subtotal: number;
  totalDiscount: number;
  discounts: PricingResult[];
  total: number;
  strategy: string;
}

interface StrategySimulationResult {
  items: { sku: string; quantity: number; basePrice: number; finalPrice: number }[];
  subtotal: number;
  total: number;
}

const STRATEGIES: Record<string, new () => PricingStrategy> = {
  RegularPricing,
  SeasonalPricing,
  BulkPricing,
  MemberPricing,
};

class PricingService {
  calculateItemPrice(item: CartItem, strategyName: string, discountConfigs: DiscountConfig[], context: PricingContext): ItemPricingResult {
    const StrategyClass = STRATEGIES[strategyName] || RegularPricing;
    const strategy = new StrategyClass();

    const itemContext: PricingContext = { ...context, quantity: item.quantity };
    let priceResult = strategy.calculatePrice(item.basePrice * item.quantity, itemContext);

    const appliedDiscounts: PricingResult[] = [];

    if (discountConfigs && discountConfigs.length > 0) {
      let decoratorChain: DiscountDecorator | PricingResult = priceResult;

      for (const config of discountConfigs) {
        let decorator: DiscountDecorator | null = null;

        if (config.type === 'PercentageDiscount' && config.value !== undefined) {
          decorator = new PercentageDiscount(null, config.value);
        } else if (config.type === 'FlatDiscount' && config.value !== undefined) {
          decorator = new FlatDiscount(null, config.value);
        } else if (config.type === 'CouponDiscount') {
          decorator = new CouponDiscount(null);
        } else if (config.type === 'LoyaltyDiscount') {
          decorator = new LoyaltyDiscount(null);
        }

        if (!decorator) continue;

        decorator.wrappedPricing = decoratorChain;
        decoratorChain = decorator;
      }

      if (decoratorChain instanceof DiscountDecorator) {
        priceResult = decoratorChain.apply(priceResult, { ...itemContext, ...context });
      }
      appliedDiscounts.push(priceResult);
    }

    return {
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      basePrice: item.basePrice,
      finalPrice: priceResult.price,
      strategy: priceResult.strategy || strategyName,
      discounts: appliedDiscounts,
    };
  }

  calculateCartPrice(items: CartItem[], strategyName: string, discountConfigs: DiscountConfig[], context: PricingContext): CartPricingResult {
    const itemResults = items.map((item) =>
      this.calculateItemPrice(item, strategyName, discountConfigs, context)
    );

    const subtotal = Math.round(itemResults.reduce((sum, item) => sum + item.basePrice * item.quantity, 0) * 100) / 100;
    const total = Math.round(itemResults.reduce((sum, item) => sum + item.finalPrice, 0) * 100) / 100;
    const totalDiscount = Math.round((subtotal - total) * 100) / 100;

    const allDiscounts = itemResults
      .filter((item) => item.discounts.length > 0)
      .flatMap((item) => item.discounts);

    return {
      items: itemResults,
      subtotal,
      totalDiscount,
      discounts: allDiscounts,
      total,
      strategy: strategyName || 'RegularPricing',
    };
  }

  simulateStrategies(items: CartItem[], context: PricingContext): Record<string, StrategySimulationResult> {
    const results: Record<string, StrategySimulationResult> = {};

    for (const [name, StrategyClass] of Object.entries(STRATEGIES)) {
      const strategy = new StrategyClass();
      const itemResults = items.map((item) => {
        const itemContext: PricingContext = { ...context, quantity: item.quantity };
        const priceResult = strategy.calculatePrice(item.basePrice * item.quantity, itemContext);
        return {
          sku: item.sku,
          quantity: item.quantity,
          basePrice: item.basePrice * item.quantity,
          finalPrice: priceResult.price,
        };
      });

      const subtotal = itemResults.reduce((sum, item) => sum + item.basePrice, 0);
      const total = itemResults.reduce((sum, item) => sum + item.finalPrice, 0);

      results[name] = { items: itemResults, subtotal, total };
    }

    return results;
  }

  getAvailableStrategies(): { name: string; description: string }[] {
    return Object.keys(STRATEGIES).map((name) => ({
      name,
      description: this.getStrategyDescription(name),
    }));
  }

  private getStrategyDescription(name: string): string {
    const descriptions: Record<string, string> = {
      RegularPricing: 'Returns base price with no modifications',
      SeasonalPricing: 'Applies seasonal multipliers (summer, winter, spring, fall, holiday)',
      BulkPricing: 'Tiered discounts: 10+ (5%), 50+ (15%), 100+ (25%)',
      MemberPricing: 'Member tier discounts: Silver (5%), Gold (10%), Platinum (15%)',
    };
    return descriptions[name] || '';
  }
}

export default new PricingService();
