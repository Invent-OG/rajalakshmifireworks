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
import { products } from './products';

export type InventoryTransactionType =
  | 'STOCK_ADDED'
  | 'STOCK_REMOVED'
  | 'ORDER_RESERVED'
  | 'ORDER_CANCELLED'
  | 'MANUAL_ADJUSTMENT';

export const inventoryTransactions = pgTable(
  'inventory_transactions',
  {
    id: serial('id').primaryKey(),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id),
    type: varchar('type', { length: 30 }).notNull(),
    quantityChange: integer('quantity_change').notNull(), // positive = add, negative = deduct
    quantityAfter: integer('quantity_after').notNull(), // snapshot of stock after this transaction
    referenceId: integer('reference_id'), // orderId or null
    referenceType: varchar('reference_type', { length: 30 }), // 'order', 'manual', etc.
    note: text('note'),
    performedBy: varchar('performed_by', { length: 255 }), // admin email or 'system'
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('inventory_transactions_product_id_idx').on(table.productId),
    index('inventory_transactions_type_idx').on(table.type),
    index('inventory_transactions_reference_idx').on(table.referenceId, table.referenceType),
    index('inventory_transactions_created_at_idx').on(table.createdAt),
  ]
);

export const inventoryTransactionsRelations = relations(inventoryTransactions, ({ one }) => ({
  product: one(products, {
    fields: [inventoryTransactions.productId],
    references: [products.id],
  }),
}));
