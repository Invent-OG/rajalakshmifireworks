import { describe, it, expect } from 'vitest';
import {
  isValidTransition,
  getNextStatuses,
  canCancel,
  isTerminalStatus,
  validateTransition,
} from '@/lib/services/order-status-machine';

describe('Order Status State Machine', () => {
  it('validates sequential delivery order transitions', () => {
    expect(isValidTransition('PENDING', 'CONFIRMED')).toBe(true);
    expect(isValidTransition('CONFIRMED', 'PROCESSING')).toBe(true);
    expect(isValidTransition('PROCESSING', 'READY')).toBe(true);
    expect(isValidTransition('READY', 'OUT_FOR_DELIVERY')).toBe(true);
    expect(isValidTransition('OUT_FOR_DELIVERY', 'COMPLETED')).toBe(true);
  });

  it('rejects invalid or backwards transitions', () => {
    expect(isValidTransition('PENDING', 'COMPLETED')).toBe(false);
    expect(isValidTransition('COMPLETED', 'PENDING')).toBe(false);
    expect(isValidTransition('CANCELLED', 'CONFIRMED')).toBe(false);
  });

  it('filters available transitions by fulfillment type', () => {
    // Delivery orders cannot be marked READY_FOR_PICKUP
    const deliveryNext = getNextStatuses('PROCESSING', 'DELIVERY');
    expect(deliveryNext).toContain('READY');
    expect(deliveryNext).not.toContain('READY_FOR_PICKUP');

    // Pickup orders cannot be marked READY or OUT_FOR_DELIVERY
    const pickupNext = getNextStatuses('PROCESSING', 'PICKUP');
    expect(pickupNext).toContain('READY_FOR_PICKUP');
    expect(pickupNext).not.toContain('READY');
    expect(pickupNext).not.toContain('OUT_FOR_DELIVERY');
  });

  it('identifies cancellable and terminal states', () => {
    expect(canCancel('PENDING')).toBe(true);
    expect(canCancel('CONFIRMED')).toBe(true);
    expect(canCancel('PROCESSING')).toBe(true);
    expect(canCancel('COMPLETED')).toBe(false);
    expect(canCancel('CANCELLED')).toBe(false);

    expect(isTerminalStatus('COMPLETED')).toBe(true);
    expect(isTerminalStatus('CANCELLED')).toBe(true);
    expect(isTerminalStatus('PROCESSING')).toBe(false);
  });

  it('returns human-readable error messages for invalid transitions', () => {
    const error1 = validateTransition('COMPLETED', 'CONFIRMED', 'DELIVERY');
    expect(error1).toBe('Cannot change status of a completed order.');

    const error2 = validateTransition('PENDING', 'OUT_FOR_DELIVERY', 'DELIVERY');
    expect(error2).toBe('Cannot transition from PENDING to OUT_FOR_DELIVERY.');

    const error3 = validateTransition('PROCESSING', 'READY_FOR_PICKUP', 'DELIVERY');
    expect(error3).toBe('Delivery orders cannot be marked as ready for pickup.');

    const error4 = validateTransition('PROCESSING', 'READY', 'PICKUP');
    expect(error4).toBe(
      'Pickup orders cannot be marked as ready for delivery or out for delivery.'
    );
  });
});
