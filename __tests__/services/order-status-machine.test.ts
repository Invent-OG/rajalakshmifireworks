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
    expect(isValidTransition('NEW', 'CONFIRMED')).toBe(true);
    expect(isValidTransition('CONFIRMED', 'ASSIGNED')).toBe(true);
    expect(isValidTransition('ASSIGNED', 'OUT_FOR_DELIVERY')).toBe(true);
    expect(isValidTransition('OUT_FOR_DELIVERY', 'DELIVERED')).toBe(true);
  });

  it('validates reassignment in ASSIGNED state', () => {
    expect(isValidTransition('ASSIGNED', 'ASSIGNED')).toBe(true);
  });

  it('rejects invalid or backwards transitions', () => {
    expect(isValidTransition('NEW', 'DELIVERED')).toBe(false);
    expect(isValidTransition('DELIVERED', 'NEW')).toBe(false);
    expect(isValidTransition('CANCELLED', 'CONFIRMED')).toBe(false);
  });

  it('identifies cancellable and terminal states', () => {
    expect(canCancel('NEW')).toBe(true);
    expect(canCancel('CONFIRMED')).toBe(true);
    expect(canCancel('ASSIGNED')).toBe(true);
    expect(canCancel('DELIVERED')).toBe(false);
    expect(canCancel('CANCELLED')).toBe(false);

    expect(isTerminalStatus('DELIVERED')).toBe(true);
    expect(isTerminalStatus('CANCELLED')).toBe(true);
    expect(isTerminalStatus('ASSIGNED')).toBe(false);
    expect(isTerminalStatus('NEW')).toBe(false);
  });

  it('returns human-readable error messages for invalid transitions', () => {
    const error1 = validateTransition('DELIVERED', 'CONFIRMED', 'DELIVERY');
    expect(error1).toBe('Cannot change status of a delivered order.');

    const error2 = validateTransition('NEW', 'OUT_FOR_DELIVERY', 'DELIVERY');
    expect(error2).toBe('Cannot transition from NEW to OUT_FOR_DELIVERY.');

    const validReassign = validateTransition('ASSIGNED', 'ASSIGNED', 'DELIVERY');
    expect(validReassign).toBeNull();
  });
});
