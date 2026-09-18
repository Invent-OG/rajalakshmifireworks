import {
  pgTable,
  varchar,
  integer,
  timestamp,
  serial,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { orders } from './orders';
import { deliveryPartners } from './delivery-partners';

export const orderDeliveryAssignments = pgTable(
  'order_delivery_assignments',
  {
    id: serial('id').primaryKey(),
    orderId: integer('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    deliveryPartnerId: integer('delivery_partner_id')
      .notNull()
      .references(() => deliveryPartners.id),
    assignedBy: varchar('assigned_by', { length: 255 }),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
    unassignedAt: timestamp('unassigned_at', { withTimezone: true }),
    status: varchar('status', { length: 30 }).notNull().default('ACTIVE'), // 'ACTIVE' | 'REASSIGNED' | 'UNASSIGNED'
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('order_delivery_assignments_order_id_idx').on(table.orderId),
    index('order_delivery_assignments_partner_id_idx').on(table.deliveryPartnerId),
    index('order_delivery_assignments_status_idx').on(table.status),
  ]
);

export const orderDeliveryAssignmentsRelations = relations(orderDeliveryAssignments, ({ one }) => ({
  order: one(orders, {
    fields: [orderDeliveryAssignments.orderId],
    references: [orders.id],
  }),
  deliveryPartner: one(deliveryPartners, {
    fields: [orderDeliveryAssignments.deliveryPartnerId],
    references: [deliveryPartners.id],
  }),
}));

export type OrderDeliveryAssignment = typeof orderDeliveryAssignments.$inferSelect;
export type NewOrderDeliveryAssignment = typeof orderDeliveryAssignments.$inferInsert;
