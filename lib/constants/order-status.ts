import type { OrderStatus, FulfillmentType } from '@/db/schema';

export const ORDER_STATUS = {
  NEW: 'NEW',
  CONFIRMED: 'CONFIRMED',
  ASSIGNED: 'ASSIGNED',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: 'New Order',
  CONFIRMED: 'Confirmed',
  ASSIGNED: 'Delivery Assigned',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  NEW: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  CONFIRMED: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  ASSIGNED: 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
  OUT_FOR_DELIVERY: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
  DELIVERED: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  CANCELLED: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
};

// Valid status transitions
export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  NEW: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['OUT_FOR_DELIVERY', 'ASSIGNED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export const DELIVERY_FLOW: OrderStatus[] = [
  'NEW',
  'CONFIRMED',
  'ASSIGNED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

export const PICKUP_FLOW: OrderStatus[] = [
  'NEW',
  'CONFIRMED',
  'DELIVERED',
];

export const FULFILLMENT_TYPES = {
  DELIVERY: 'DELIVERY',
  PICKUP: 'PICKUP',
} as const;

export const FULFILLMENT_LABELS: Record<FulfillmentType, string> = {
  DELIVERY: 'Doorstep Delivery',
  PICKUP: 'Counter Pickup',
};

// Statuses that can be cancelled
export const CANCELLABLE_STATUSES: OrderStatus[] = [
  'NEW',
  'CONFIRMED',
  'ASSIGNED',
];
