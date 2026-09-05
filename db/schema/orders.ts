import {
  pgTable,
  text,
  varchar,
  integer,
  timestamp,
  serial,
  numeric,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { customers } from './customers';
import { orderItems } from './order-items';
import { orderStatusHistory } from './order-status-history';
import { whatsappMessages } from './whatsapp-messages';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'READY'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'COMPLETED'
  | 'CANCELLED';

export type FulfillmentType = 'DELIVERY' | 'PICKUP';

export const orders = pgTable(
  'orders',
  {
    id: serial('id').primaryKey(),
    invoiceNumber: varchar('invoice_number', { length: 50 }).notNull(),
    customerId: integer('customer_id')
      .notNull()
      .references(() => customers.id),
    orderStatus: varchar('order_status', { length: 30 }).notNull().default('PENDING'),
    fulfillmentType: varchar('fulfillment_type', { length: 20 }).notNull(), // 'DELIVERY' | 'PICKUP'
    subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
    discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).notNull().default('0'),
    deliveryCharge: numeric('delivery_charge', { precision: 10, scale: 2 }).notNull().default('0'),
    totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
    // Customer snapshots — never change after order creation
    customerNameSnapshot: varchar('customer_name_snapshot', { length: 255 }).notNull(),
    customerMobileSnapshot: varchar('customer_mobile_snapshot', { length: 15 }).notNull(),
    addressSnapshot: jsonb('address_snapshot'), // { address, city, pincode }
    notes: text('notes'),
    idempotencyKey: varchar('idempotency_key', { length: 100 }),
    placedAt: timestamp('placed_at', { withTimezone: true }).notNull().defaultNow(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('orders_invoice_number_idx').on(table.invoiceNumber),
    uniqueIndex('orders_idempotency_key_idx').on(table.idempotencyKey),
    index('orders_customer_id_idx').on(table.customerId),
    index('orders_order_status_idx').on(table.orderStatus),
    index('orders_customer_mobile_snapshot_idx').on(table.customerMobileSnapshot),
    index('orders_fulfillment_type_idx').on(table.fulfillmentType),
    index('orders_placed_at_idx').on(table.placedAt),
    index('orders_created_at_idx').on(table.createdAt),
  ]
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
  statusHistory: many(orderStatusHistory),
  whatsappMessages: many(whatsappMessages),
}));
