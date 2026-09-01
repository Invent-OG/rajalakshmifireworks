import {
  pgTable,
  varchar,
  integer,
  timestamp,
  serial,
  numeric,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { orders } from './orders';
import { products } from './products';

export const orderItems = pgTable(
  'order_items',
  {
    id: serial('id').primaryKey(),
    orderId: integer('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id),
    // Snapshots — frozen at order time
    productNameSnapshot: varchar('product_name_snapshot', { length: 255 }).notNull(),
    productSkuSnapshot: varchar('product_sku_snapshot', { length: 100 }),
    mrpSnapshot: numeric('mrp_snapshot', { precision: 10, scale: 2 }).notNull(),
    sellingPriceSnapshot: numeric('selling_price_snapshot', { precision: 10, scale: 2 }).notNull(),
    quantity: integer('quantity').notNull(),
    discountPerUnit: numeric('discount_per_unit', { precision: 10, scale: 2 }).notNull().default('0'),
    lineTotal: numeric('line_total', { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('order_items_order_id_idx').on(table.orderId),
    index('order_items_product_id_idx').on(table.productId),
  ]
);

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
