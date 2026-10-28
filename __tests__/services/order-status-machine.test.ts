import { describe, it, expect } from 'vitest';
import {
  isValidTransition,
  getNextStatuses,
  canCancel,
  canRevokeCancellation,
  isTerminalStatus,
  validateTransition,
  getStatusTimestampField,
} from '@/lib/services/order-status-machine';

describe('Order Status State Machine', () => {
  it('validates sequential delivery order transitions', () => {
    expect(isValidTransition('NEW', 'CONFIRMED')).toBe(true);
    expect(isValidTransition('CONFIRMED', 'PROCESSING')).toBe(true);
    expect(isValidTransition('CONFIRMED', 'PACKED')).toBe(true);
    expect(isValidTransition('PROCESSING', 'PACKED')).toBe(true);
    expect(isValidTransition('PACKED', 'ASSIGNED')).toBe(true);
    expect(isValidTransition('ASSIGNED', 'OUT_FOR_DELIVERY')).toBe(true);
    expect(isValidTransition('OUT_FOR_DELIVERY', 'DELIVERED')).toBe(true);
    expect(isValidTransition('DELIVERED', 'COMPLETED')).toBe(true);
  });

  it('validates pickup order transitions', () => {
    expect(isValidTransition('CONFIRMED', 'PACKED')).toBe(true);
    expect(isValidTransition('PACKED', 'READY_FOR_PICKUP')).toBe(true);
    expect(isValidTransition('READY_FOR_PICKUP', 'PICKED_UP')).toBe(true);
    expect(isValidTransition('PICKED_UP', 'COMPLETED')).toBe(true);
  });

  it('validates reassignment in ASSIGNED state', () => {
    expect(isValidTransition('ASSIGNED', 'ASSIGNED')).toBe(true);
  });

  it('rejects invalid or backwards transitions', () => {
    expect(isValidTransition('NEW', 'DELIVERED')).toBe(false);
    expect(isValidTransition('DELIVERED', 'NEW')).toBe(false);
    expect(isValidTransition('COMPLETED', 'CONFIRMED')).toBe(false);
    expect(isValidTransition('CANCELLED', 'CONFIRMED')).toBe(false);
  });

  it('identifies cancellable and terminal states', () => {
    expect(canCancel('NEW')).toBe(true);
    expect(canCancel('CONFIRMED')).toBe(true);
    expect(canCancel('PROCESSING')).toBe(true);
    expect(canCancel('PACKED')).toBe(true);
    expect(canCancel('ASSIGNED')).toBe(true);
    expect(canCancel('READY_FOR_PICKUP')).toBe(true);
    expect(canCancel('DELIVERED')).toBe(false);
    expect(canCancel('COMPLETED')).toBe(false);
    expect(canCancel('CANCELLED')).toBe(false);

    expect(canRevokeCancellation('CANCELLED')).toBe(true);
    expect(canRevokeCancellation('NEW')).toBe(false);
    expect(canRevokeCancellation('CONFIRMED')).toBe(false);
    expect(canRevokeCancellation('COMPLETED')).toBe(false);

    expect(isTerminalStatus('COMPLETED')).toBe(true);
    expect(isTerminalStatus('CANCELLED')).toBe(true);
    expect(isTerminalStatus('DELIVERED')).toBe(false);
    expect(isTerminalStatus('ASSIGNED')).toBe(false);
    expect(isTerminalStatus('NEW')).toBe(false);
  });

  it('returns human-readable error messages for invalid transitions', () => {
    const error1 = validateTransition('COMPLETED', 'CONFIRMED', 'DELIVERY');
    expect(error1).toBe('Cannot change status of a completed order.');

    const error2 = validateTransition('NEW', 'OUT_FOR_DELIVERY', 'DELIVERY');
    expect(error2).toBe('Cannot transition from NEW to OUT_FOR_DELIVERY.');

    const errorPickupOnDelivery = validateTransition('PACKED', 'READY_FOR_PICKUP', 'DELIVERY');
    expect(errorPickupOnDelivery).toBe('Cannot set pickup status for doorstep delivery orders.');

    const errorDeliveryOnPickup = validateTransition('PACKED', 'ASSIGNED', 'PICKUP');
    expect(errorDeliveryOnPickup).toBe('Cannot assign delivery or dispatch for counter pickup orders.');

    const validReassign = validateTransition('ASSIGNED', 'ASSIGNED', 'DELIVERY');
    expect(validReassign).toBeNull();
  });

  it('correctly maps timestamp fields for all workflow milestones', () => {
    expect(getStatusTimestampField('CONFIRMED')).toBe('confirmedAt');
    expect(getStatusTimestampField('PACKED')).toBe('packedAt');
    expect(getStatusTimestampField('ASSIGNED')).toBe('assignedAt');
    expect(getStatusTimestampField('OUT_FOR_DELIVERY')).toBe('dispatchedAt');
    expect(getStatusTimestampField('READY_FOR_PICKUP')).toBe('readyForPickupAt');
    expect(getStatusTimestampField('PICKED_UP')).toBe('pickedUpAt');
    expect(getStatusTimestampField('DELIVERED')).toBe('deliveredAt');
    expect(getStatusTimestampField('COMPLETED')).toBe('completedAt');
    expect(getStatusTimestampField('CANCELLED')).toBe('cancelledAt');
    expect(getStatusTimestampField('NEW')).toBeNull();
  });

  it('filters next statuses by fulfillment type', () => {
    const deliveryNext = getNextStatuses('PACKED', 'DELIVERY');
    expect(deliveryNext).toContain('ASSIGNED');
    expect(deliveryNext).not.toContain('READY_FOR_PICKUP');

    const pickupNext = getNextStatuses('PACKED', 'PICKUP');
    expect(pickupNext).toContain('READY_FOR_PICKUP');
    expect(pickupNext).not.toContain('ASSIGNED');
    expect(pickupNext).not.toContain('OUT_FOR_DELIVERY');
  });
});
