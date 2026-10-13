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
    // Delivery orders cannot transition to pickup-specific statuses
    if (fulfillmentType === 'DELIVERY' && (status === 'READY_FOR_PICKUP' || status === 'PICKED_UP')) {
      return false;
    }
    // Pickup orders bypass delivery assignment and dispatch steps
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
  return status === 'COMPLETED' || status === 'CANCELLED';
}

export function getStatusTimestampField(status: OrderStatus): string | null {
  switch (status) {
    case 'CONFIRMED':
      return 'confirmedAt';
    case 'PACKED':
      return 'packedAt';
    case 'ASSIGNED':
      return 'assignedAt';
    case 'OUT_FOR_DELIVERY':
      return 'dispatchedAt';
    case 'READY_FOR_PICKUP':
      return 'readyForPickupAt';
    case 'PICKED_UP':
      return 'pickedUpAt';
    case 'DELIVERED':
      return 'deliveredAt';
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

  // Reassignment check in ASSIGNED state
  if (currentStatus === 'ASSIGNED' && newStatus === 'ASSIGNED') {
    return null;
  }

  // Prevent delivery-specific statuses on pickup orders
  if (fulfillmentType === 'PICKUP' && (newStatus === 'ASSIGNED' || newStatus === 'OUT_FOR_DELIVERY')) {
    return `Cannot assign delivery or dispatch for counter pickup orders.`;
  }

  // Prevent pickup-specific statuses on delivery orders
  if (fulfillmentType === 'DELIVERY' && (newStatus === 'READY_FOR_PICKUP' || newStatus === 'PICKED_UP')) {
    return `Cannot set pickup status for doorstep delivery orders.`;
  }

  if (!isValidTransition(currentStatus, newStatus)) {
    return `Cannot transition from ${currentStatus} to ${newStatus}.`;
  }

  return null;
}

