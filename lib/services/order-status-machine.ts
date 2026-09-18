import type { OrderStatus, FulfillmentType } from '@/db/schema';
import { VALID_TRANSITIONS, CANCELLABLE_STATUSES } from '@/lib/constants/order-status';

/**
 * Centralized order status state machine.
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

  return allowed.filter((status) => {
    // Pickup orders bypass ASSIGNED and OUT_FOR_DELIVERY directly to DELIVERED
    if (fulfillmentType === 'PICKUP' && (status === 'ASSIGNED' || status === 'OUT_FOR_DELIVERY')) {
      return false;
    }
    return true;
  });
}

export function canCancel(status: OrderStatus): boolean {
  return CANCELLABLE_STATUSES.includes(status);
}

export function isTerminalStatus(status: OrderStatus): boolean {
  return status === 'DELIVERED' || status === 'CANCELLED';
}

export function getStatusTimestampField(status: OrderStatus): string | null {
  switch (status) {
    case 'CONFIRMED':
      return 'confirmedAt';
    case 'ASSIGNED':
      return 'assignedAt';
    case 'DELIVERED':
      return 'deliveredAt';
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

  // Reassignment check in ASSIGNED state
  if (currentStatus === 'ASSIGNED' && newStatus === 'ASSIGNED') {
    return null;
  }

  if (!isValidTransition(currentStatus, newStatus)) {
    return `Cannot transition from ${currentStatus} to ${newStatus}.`;
  }

  return null;
}
