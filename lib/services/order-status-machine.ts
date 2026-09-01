import type { OrderStatus, FulfillmentType } from '@/db/schema';
import { VALID_TRANSITIONS, CANCELLABLE_STATUSES } from '@/lib/constants/order-status';

/**
 * Centralized order status state machine.
 * All status transition logic lives here — UI components and API routes
 * call these functions instead of implementing their own transition logic.
 */

export function isValidTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
  const allowed = VALID_TRANSITIONS[currentStatus];
  return allowed?.includes(newStatus) ?? false;
}

export function getNextStatuses(
  currentStatus: OrderStatus,
  fulfillmentType: FulfillmentType
): OrderStatus[] {
  const allowed = VALID_TRANSITIONS[currentStatus] || [];

  // Filter based on fulfillment type
  return allowed.filter((status) => {
    // Delivery orders don't go to READY_FOR_PICKUP
    if (fulfillmentType === 'DELIVERY' && status === 'READY_FOR_PICKUP') return false;
    // Pickup orders don't go to READY or OUT_FOR_DELIVERY
    if (fulfillmentType === 'PICKUP' && (status === 'READY' || status === 'OUT_FOR_DELIVERY')) return false;
    return true;
  });
}

export function canCancel(status: OrderStatus): boolean {
  return CANCELLABLE_STATUSES.includes(status);
}

export function isTerminalStatus(status: OrderStatus): boolean {
  return status === 'COMPLETED' || status === 'CANCELLED';
}

export function getStatusTimestampField(status: OrderStatus): string | null {
  switch (status) {
    case 'CONFIRMED':
      return 'confirmedAt';
    case 'COMPLETED':
      return 'completedAt';
    case 'CANCELLED':
      return 'cancelledAt';
    default:
      return null;
  }
}

/**
 * Validate a status transition and return an error message if invalid
 */
export function validateTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
  fulfillmentType: FulfillmentType
): string | null {
  if (isTerminalStatus(currentStatus)) {
    return `Cannot change status of a ${currentStatus.toLowerCase()} order.`;
  }

  if (!isValidTransition(currentStatus, newStatus)) {
    return `Cannot transition from ${currentStatus} to ${newStatus}.`;
  }

  // Validate fulfillment-specific transitions
  if (fulfillmentType === 'DELIVERY' && newStatus === 'READY_FOR_PICKUP') {
    return 'Delivery orders cannot be marked as ready for pickup.';
  }

  if (fulfillmentType === 'PICKUP' && (newStatus === 'READY' || newStatus === 'OUT_FOR_DELIVERY')) {
    return 'Pickup orders cannot be marked as ready for delivery or out for delivery.';
  }

  return null;
}
