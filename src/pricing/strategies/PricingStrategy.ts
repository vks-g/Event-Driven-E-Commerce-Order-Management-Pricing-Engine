export interface PricingContext {
  season?: string;
  quantity?: number;
  memberTier?: string;
  couponCode?: string;
  loyaltyTier?: string;
  [key: string]: unknown;
}

export interface PricingResult {
  price: number;
  strategy?: string;
  season?: string;
  multiplier?: number;
  discount?: number;
  quantity?: number;
  memberTier?: string;
  discountAmount?: number;
  discountType?: string;
  discountValue?: number;
  appliedBy?: string;
  couponApplied?: boolean;
  couponCode?: string;
  loyaltyApplied?: boolean;
  loyaltyTier?: string;
  [key: string]: unknown;
}

export abstract class PricingStrategy {
  abstract calculatePrice(basePrice: number, context: PricingContext): PricingResult;
}
