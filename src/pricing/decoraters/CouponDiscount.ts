import { DiscountDecorator } from './DiscountDecorator';
import type { PricingContext, PricingResult } from '../strategies/PricingStrategy';

const VALID_COUPONS: Record<string, { percentage?: number; flat?: number }> = {
  SAVE10: { percentage: 10 },
  SAVE20: { percentage: 20 },
  FLAT5: { flat: 5 },
  FLAT15: { flat: 15 },
};

export class CouponDiscount extends DiscountDecorator {
  constructor(wrappedPricing: DiscountDecorator | PricingResult | null) {
    super(wrappedPricing);
  }

  apply(priceResult: PricingResult, context: PricingContext): PricingResult {
    const base = this.getBaseResult(priceResult, context);
    const couponCode = context.couponCode || '';
    const coupon = VALID_COUPONS[String(couponCode).toUpperCase()];

    if (!coupon) {
      return {
        ...base,
        appliedBy: 'CouponDiscount',
        couponApplied: false,
        couponCode: String(couponCode),
      };
    }

    let discountAmount = 0;
    if (coupon.percentage) {
      discountAmount = Math.round(base.price * (coupon.percentage / 100) * 100) / 100;
    } else if (coupon.flat) {
      discountAmount = Math.min(coupon.flat, base.price);
    }

    return {
      price: Math.max(0, Math.round((base.price - discountAmount) * 100) / 100),
      discountAmount,
      discountType: coupon.percentage ? 'percentage' : 'flat',
      discountValue: coupon.percentage || coupon.flat,
      appliedBy: 'CouponDiscount',
      couponApplied: true,
      couponCode: String(couponCode).toUpperCase(),
    };
  }

  private getBaseResult(priceResult: PricingResult, context: PricingContext): PricingResult {
    if (this.wrappedPricing instanceof DiscountDecorator) {
      return this.wrappedPricing.apply(priceResult, context);
    }
    return priceResult;
  }
}
