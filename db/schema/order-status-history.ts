import {
  pgTable,
  text,
  varchar,
  integer,
  timestamp,
  serial,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { orders } from './orders';

export const orderStatusHistory = pgTable(
  'order_status_history',
  {
    id: serial('id').primaryKey(),
    orderId: integer('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    oldStatus: varchar('old_status', { length: 30 }),
    newStatus: varchar('new_status', { length: 30 }).notNull(),
    changedBy: varchar('changed_by', { length: 255 }), // admin email or 'system'
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('order_status_history_order_id_idx').on(table.orderId),
    index('order_status_history_created_at_idx').on(table.createdAt),
  ]
);

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, {
    fields: [orderStatusHistory.orderId],
    references: [orders.id],
  }),
}));
