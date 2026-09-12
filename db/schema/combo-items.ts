import {
  pgTable,
  integer,
  timestamp,
  serial,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { products } from './products';

export const comboItems = pgTable(
  'combo_items',
  {
    id: serial('id').primaryKey(),
    comboProductId: integer('combo_product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(1),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('combo_items_combo_product_id_idx').on(table.comboProductId),
    index('combo_items_product_id_idx').on(table.productId),
  ]
);

export const comboItemsRelations = relations(comboItems, ({ one }) => ({
  comboProduct: one(products, {
    fields: [comboItems.comboProductId],
    references: [products.id],
    relationName: 'comboProductRelation',
  }),
  product: one(products, {
    fields: [comboItems.productId],
    references: [products.id],
    relationName: 'itemProductRelation',
  }),
}));
