import { PercentageDiscount } from '../../../src/pricing/decorators/PercentageDiscount';
import { FlatDiscount } from '../../../src/pricing/decorators/FlatDiscount';
import { CouponDiscount } from '../../../src/pricing/decorators/CouponDiscount';
import { LoyaltyDiscount } from '../../../src/pricing/decorators/LoyaltyDiscount';
import type { PricingResult, PricingContext } from '../../../src/pricing/strategies/PricingStrategy';

const baseResult: PricingResult = { price: 100 };

const mockWrapped = {
  apply: (p: PricingResult, _ctx: PricingContext): PricingResult => p,
  wrappedPricing: null,
};

describe('Discount Decorators', () => {
  describe('PercentageDiscount', () => {
    it('applies 10% discount', () => {
      const decorator = new PercentageDiscount(mockWrapped as unknown as null, 10);
      const result = decorator.apply(baseResult, {});
      expect(result.price).toBe(90);
      expect(result.discountAmount).toBe(10);
    });

    it('applies 25% discount', () => {
      const decorator = new PercentageDiscount(mockWrapped as unknown as null, 25);
      const result = decorator.apply(baseResult, {});
      expect(result.price).toBe(75);
    });
  });

  describe('FlatDiscount', () => {
    it('applies $5 flat discount', () => {
      const decorator = new FlatDiscount(mockWrapped as unknown as null, 5);
      const result = decorator.apply(baseResult, {});
      expect(result.price).toBe(95);
      expect(result.discountAmount).toBe(5);
    });

    it('floors price at 0 when discount exceeds price', () => {
      const decorator = new FlatDiscount(mockWrapped as unknown as null, 150);
      const result = decorator.apply(baseResult, {});
      expect(result.price).toBe(0);
      expect(result.discountAmount).toBe(100);
    });
  });

  describe('CouponDiscount', () => {
    it('applies percentage coupon SAVE10', () => {
      const decorator = new CouponDiscount(mockWrapped as unknown as null);
      const result = decorator.apply(baseResult, { couponCode: 'SAVE10' });
      expect(result.price).toBe(90);
      expect(result.couponApplied).toBe(true);
    });

    it('applies flat coupon FLAT5', () => {
      const decorator = new CouponDiscount(mockWrapped as unknown as null);
      const result = decorator.apply(baseResult, { couponCode: 'FLAT5' });
      expect(result.price).toBe(95);
    });

    it('does not apply invalid coupon', () => {
      const decorator = new CouponDiscount(mockWrapped as unknown as null);
      const result = decorator.apply(baseResult, { couponCode: 'INVALID' });
      expect(result.price).toBe(100);
      expect(result.couponApplied).toBe(false);
    });
  });

  describe('LoyaltyDiscount', () => {
    it('applies gold loyalty discount (10%)', () => {
      const decorator = new LoyaltyDiscount(mockWrapped as unknown as null);
      const result = decorator.apply(baseResult, { loyaltyTier: 'gold' });
      expect(result.price).toBe(90);
      expect(result.loyaltyApplied).toBe(true);
    });

    it('applies diamond loyalty discount (20%)', () => {
      const decorator = new LoyaltyDiscount(mockWrapped as unknown as null);
      const result = decorator.apply(baseResult, { loyaltyTier: 'diamond' });
      expect(result.price).toBe(80);
    });

    it('no discount for no tier', () => {
      const decorator = new LoyaltyDiscount(mockWrapped as unknown as null);
      const result = decorator.apply(baseResult, {});
      expect(result.price).toBe(100);
      expect(result.loyaltyApplied).toBe(false);
    });
  });

  describe('Decorator composition/stacking', () => {
    it('decorators compose correctly when chained', () => {
      const base: PricingResult = { price: 100 };

      const pctDecorator = new PercentageDiscount(null, 10);
      pctDecorator.wrappedPricing = mockWrapped as unknown as null;

      const flatDecorator = new FlatDiscount(pctDecorator, 5);

      const result = flatDecorator.apply(base, {});
      expect(result.price).toBe(85);
    });

    it('multiple decorators stack and floor at 0', () => {
      const base: PricingResult = { price: 20 };

      const pctDecorator = new PercentageDiscount(null, 50);
      pctDecorator.wrappedPricing = mockWrapped as unknown as null;

      const flatDecorator = new FlatDiscount(pctDecorator, 15);

      const result = flatDecorator.apply(base, {});
      expect(result.price).toBe(0);
    });
  });
});
