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
import { states } from './states';
import { cities } from './cities';
import { deliveryPartners } from './delivery-partners';
import { orderDeliveryAssignments } from './order-delivery-assignments';

export type OrderStatus =
  | 'NEW'
  | 'CONFIRMED'
  | 'ASSIGNED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
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
    stateId: integer('state_id').references(() => states.id),
    cityId: integer('city_id').references(() => cities.id),
    deliveryPartnerId: integer('delivery_partner_id').references(() => deliveryPartners.id),
    assignedAt: timestamp('assigned_at', { withTimezone: true }),
    assignedBy: varchar('assigned_by', { length: 255 }),
    orderStatus: varchar('order_status', { length: 30 }).notNull().default('NEW'),
    fulfillmentType: varchar('fulfillment_type', { length: 20 }).notNull(), // 'DELIVERY' | 'PICKUP'
    subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
    discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).notNull().default('0'),
    deliveryCharge: numeric('delivery_charge', { precision: 10, scale: 2 }).notNull().default('0'),
    totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
    // Customer snapshots — never change after order creation
    customerNameSnapshot: varchar('customer_name_snapshot', { length: 255 }).notNull(),
    customerMobileSnapshot: varchar('customer_mobile_snapshot', { length: 15 }).notNull(),
    addressSnapshot: jsonb('address_snapshot'), // { stateId, cityId, deliveryStateName, deliveryCityName, deliveryAddress, pincode }
    notes: text('notes'),
    idempotencyKey: varchar('idempotency_key', { length: 100 }),
    placedAt: timestamp('placed_at', { withTimezone: true }).notNull().defaultNow(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('orders_invoice_number_idx').on(table.invoiceNumber),
    uniqueIndex('orders_idempotency_key_idx').on(table.idempotencyKey),
    index('orders_customer_id_idx').on(table.customerId),
    index('orders_state_id_idx').on(table.stateId),
    index('orders_city_id_idx').on(table.cityId),
    index('orders_delivery_partner_id_idx').on(table.deliveryPartnerId),
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
  state: one(states, {
    fields: [orders.stateId],
    references: [states.id],
  }),
  city: one(cities, {
    fields: [orders.cityId],
    references: [cities.id],
  }),
  deliveryPartner: one(deliveryPartners, {
    fields: [orders.deliveryPartnerId],
    references: [deliveryPartners.id],
  }),
  items: many(orderItems),
  statusHistory: many(orderStatusHistory),
  deliveryAssignments: many(orderDeliveryAssignments),
  whatsappMessages: many(whatsappMessages),
}));

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
