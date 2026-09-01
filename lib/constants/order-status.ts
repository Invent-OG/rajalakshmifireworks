import type { OrderStatus, FulfillmentType } from '@/db/schema';

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  READY: 'READY',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  READY: 'Ready',
  READY_FOR_PICKUP: 'Ready for Pickup',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-indigo-100 text-indigo-800',
  READY: 'bg-emerald-100 text-emerald-800',
  READY_FOR_PICKUP: 'bg-teal-100 text-teal-800',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

// Valid status transitions — source of truth for the state machine
export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['READY', 'READY_FOR_PICKUP', 'CANCELLED'],
  READY: ['OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'],
  READY_FOR_PICKUP: ['COMPLETED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

// Delivery flow: PENDING → CONFIRMED → PROCESSING → READY → OUT_FOR_DELIVERY → COMPLETED
// Pickup flow:  PENDING → CONFIRMED → PROCESSING → READY_FOR_PICKUP → COMPLETED

export const DELIVERY_FLOW: OrderStatus[] = [
  'PENDING', 'CONFIRMED', 'PROCESSING', 'READY', 'OUT_FOR_DELIVERY', 'COMPLETED',
];

export const PICKUP_FLOW: OrderStatus[] = [
  'PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'COMPLETED',
];

export const FULFILLMENT_TYPES = {
  DELIVERY: 'DELIVERY',
  PICKUP: 'PICKUP',
} as const;

export const FULFILLMENT_LABELS: Record<FulfillmentType, string> = {
  DELIVERY: 'Home Delivery',
  PICKUP: 'Shop Pickup',
};

// Statuses that can be cancelled
export const CANCELLABLE_STATUSES: OrderStatus[] = [
  'PENDING', 'CONFIRMED', 'PROCESSING', 'READY', 'READY_FOR_PICKUP',
];
