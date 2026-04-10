import OrderStateMachine from '../../../src/orders/orderStateMachine';

describe('OrderStateMachine', () => {
  describe('isValidTransition', () => {
    it('allows PENDING -> CONFIRMED', () => {
      expect(OrderStateMachine.isValidTransition('PENDING', 'CONFIRMED')).toBe(true);
    });

    it('allows PENDING -> CANCELLED', () => {
      expect(OrderStateMachine.isValidTransition('PENDING', 'CANCELLED')).toBe(true);
    });

    it('allows CONFIRMED -> PAYMENT_PROCESSING', () => {
      expect(OrderStateMachine.isValidTransition('CONFIRMED', 'PAYMENT_PROCESSING')).toBe(true);
    });

    it('allows PAID -> SHIPPING', () => {
      expect(OrderStateMachine.isValidTransition('PAID', 'SHIPPING')).toBe(true);
    });

    it('rejects PENDING -> SHIPPED', () => {
      expect(OrderStateMachine.isValidTransition('PENDING', 'SHIPPED')).toBe(false);
    });

    it('rejects DELIVERED -> any', () => {
      expect(OrderStateMachine.isValidTransition('DELIVERED', 'PENDING')).toBe(false);
    });
  });

  describe('transition', () => {
    it('returns new status on valid transition', () => {
      expect(OrderStateMachine.transition('PENDING', 'CONFIRMED')).toBe('CONFIRMED');
    });

    it('throws on invalid transition', () => {
      expect(() => OrderStateMachine.transition('PENDING', 'SHIPPED')).toThrow();
    });

    it('returns same status if already at target', () => {
      expect(OrderStateMachine.transition('PENDING', 'PENDING')).toBe('PENDING');
    });
  });

  describe('getAvailableTransitions', () => {
    it('returns allowed transitions for PENDING', () => {
      const transitions = OrderStateMachine.getAvailableTransitions('PENDING');
      expect(transitions).toContain('CONFIRMED');
      expect(transitions).toContain('CANCELLED');
    });

    it('returns empty array for terminal states', () => {
      expect(OrderStateMachine.getAvailableTransitions('DELIVERED')).toEqual([]);
    });
  });
});
