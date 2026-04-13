import { RegularPricing } from '../../../src/pricing/strategies/RegularPricing';
import { SeasonalPricing } from '../../../src/pricing/strategies/SeasonalPricing';
import { BulkPricing } from '../../../src/pricing/strategies/BulkPricing';
import { MemberPricing } from '../../../src/pricing/strategies/MemberPricing';

describe('Pricing Strategies', () => {
  describe('RegularPricing', () => {
    it('returns base price as-is', () => {
      const strategy = new RegularPricing();
      const result = strategy.calculatePrice(100, {});
      expect(result.price).toBe(100);
      expect(result.strategy).toBe('RegularPricing');
    });
  });

  describe('SeasonalPricing', () => {
    it('applies summer multiplier', () => {
      const strategy = new SeasonalPricing();
      const result = strategy.calculatePrice(100, { season: 'summer' });
      expect(result.price).toBe(115);
      expect(result.multiplier).toBe(1.15);
    });

    it('applies holiday multiplier', () => {
      const strategy = new SeasonalPricing();
      const result = strategy.calculatePrice(100, { season: 'holiday' });
      expect(result.price).toBe(125);
    });

    it('defaults to 1.0 for unknown season', () => {
      const strategy = new SeasonalPricing();
      const result = strategy.calculatePrice(100, { season: 'unknown' });
      expect(result.price).toBe(100);
    });
  });

  describe('BulkPricing', () => {
    it('applies 5% discount for 10+ items', () => {
      const strategy = new BulkPricing();
      const result = strategy.calculatePrice(100, { quantity: 10 });
      expect(result.price).toBe(95);
      expect(result.discount).toBe(0.05);
    });

    it('applies 15% discount for 50+ items', () => {
      const strategy = new BulkPricing();
      const result = strategy.calculatePrice(100, { quantity: 50 });
      expect(result.price).toBe(85);
      expect(result.discount).toBe(0.15);
    });

    it('applies 25% discount for 100+ items', () => {
      const strategy = new BulkPricing();
      const result = strategy.calculatePrice(100, { quantity: 100 });
      expect(result.price).toBe(75);
      expect(result.discount).toBe(0.25);
    });

    it('no discount for less than 10 items', () => {
      const strategy = new BulkPricing();
      const result = strategy.calculatePrice(100, { quantity: 5 });
      expect(result.price).toBe(100);
      expect(result.discount).toBe(0);
    });
  });

  describe('MemberPricing', () => {
    it('applies 5% discount for silver', () => {
      const strategy = new MemberPricing();
      const result = strategy.calculatePrice(100, { memberTier: 'silver' });
      expect(result.price).toBe(95);
    });

    it('applies 10% discount for gold', () => {
      const strategy = new MemberPricing();
      const result = strategy.calculatePrice(100, { memberTier: 'gold' });
      expect(result.price).toBe(90);
    });

    it('applies 15% discount for platinum', () => {
      const strategy = new MemberPricing();
      const result = strategy.calculatePrice(100, { memberTier: 'platinum' });
      expect(result.price).toBe(85);
    });

    it('no discount for non-member', () => {
      const strategy = new MemberPricing();
      const result = strategy.calculatePrice(100, { memberTier: 'none' });
      expect(result.price).toBe(100);
    });
  });

  describe('Strategy switching at runtime', () => {
    it('can switch between strategies dynamically', () => {
      const strategies = {
        regular: new RegularPricing(),
        seasonal: new SeasonalPricing(),
        bulk: new BulkPricing(),
        member: new MemberPricing(),
      };

      const basePrice = 200;
      const context = { season: 'holiday', quantity: 50, memberTier: 'gold' };

      expect(strategies.regular.calculatePrice(basePrice, {}).price).toBe(200);
      expect(strategies.seasonal.calculatePrice(basePrice, context).price).toBe(250);
      expect(strategies.bulk.calculatePrice(basePrice, context).price).toBe(170);
      expect(strategies.member.calculatePrice(basePrice, context).price).toBe(180);
    });
  });
});
