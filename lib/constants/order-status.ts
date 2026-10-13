import type { OrderStatus, FulfillmentType } from '@/db/schema';

export const ORDER_STATUS = {
  NEW: 'NEW',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  PACKED: 'PACKED',
  ASSIGNED: 'ASSIGNED',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  PICKED_UP: 'PICKED_UP',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: 'New Order',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  PACKED: 'Packed',
  ASSIGNED: 'Delivery Assigned',
  OUT_FOR_DELIVERY: 'Dispatched / Out for Delivery',
  READY_FOR_PICKUP: 'Ready for Pickup',
  PICKED_UP: 'Picked Up',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  NEW: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  CONFIRMED: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  PROCESSING: 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800',
  PACKED: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
  ASSIGNED: 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
  OUT_FOR_DELIVERY: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
  READY_FOR_PICKUP: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
  PICKED_UP: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  DELIVERED: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  COMPLETED: 'bg-green-50 text-green-900 border-green-300 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800',
  CANCELLED: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
};

// Valid status transitions
export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  NEW: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'PACKED', 'ASSIGNED', 'READY_FOR_PICKUP', 'DELIVERED', 'CANCELLED'],
  PROCESSING: ['PACKED', 'CANCELLED'],
  PACKED: ['ASSIGNED', 'OUT_FOR_DELIVERY', 'READY_FOR_PICKUP', 'CANCELLED'],
  ASSIGNED: ['OUT_FOR_DELIVERY', 'ASSIGNED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  READY_FOR_PICKUP: ['PICKED_UP', 'DELIVERED', 'CANCELLED'],
  PICKED_UP: ['COMPLETED'],
  DELIVERED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const DELIVERY_FLOW: OrderStatus[] = [
  'NEW',
  'CONFIRMED',
  'PROCESSING',
  'PACKED',
  'ASSIGNED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'COMPLETED',
];

export const PICKUP_FLOW: OrderStatus[] = [
  'NEW',
  'CONFIRMED',
  'PROCESSING',
  'PACKED',
  'READY_FOR_PICKUP',
  'PICKED_UP',
  'COMPLETED',
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
  'PROCESSING',
  'PACKED',
  'ASSIGNED',
  'READY_FOR_PICKUP',
];

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Payment Pending',
  PAID: 'Paid',
  FAILED: 'Payment Failed',
  REFUNDED: 'Refunded',
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  PAID: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  FAILED: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
  REFUNDED: 'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
};

export const PAYMENT_METHODS = [
  { id: 'UPI', label: 'UPI / GPay / PhonePe' },
  { id: 'BANK_TRANSFER', label: 'Bank Transfer (NEFT/IMPS)' },
  { id: 'CASH', label: 'Cash on Counter / Delivery' },
  { id: 'OTHER', label: 'Other / Cheque' },
] as const;
