import { z } from 'zod';
import { customerSchema, addressSchema } from './customer';

export const cartItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(50),
});

export const checkoutSchema = z.object({
  customer: customerSchema,
  address: addressSchema.optional(),
  fulfillmentType: z.enum(['DELIVERY', 'PICKUP']),
  notes: z.string().max(500).optional(),
  items: z.array(cartItemSchema).min(1, 'Cart cannot be empty'),
  idempotencyKey: z.string().min(1).max(100),
});

export const orderTrackingSchema = z.object({
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number')
    .trim(),
  invoiceNumber: z.string().optional(),
});

export const orderStatusUpdateSchema = z.object({
  newStatus: z.enum([
    'NEW',
    'CONFIRMED',
    'ASSIGNED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
  ]),
  note: z.string().max(500).optional(),
});

export const assignDeliverySchema = z.object({
  deliveryPartnerId: z.coerce.number().int().positive('Please select a valid delivery partner'),
  note: z.string().max(500).optional(),
});

export type CartItemInput = z.infer<typeof cartItemSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type OrderTrackingInput = z.infer<typeof orderTrackingSchema>;
export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;
export type AssignDeliveryInput = z.infer<typeof assignDeliverySchema>;
