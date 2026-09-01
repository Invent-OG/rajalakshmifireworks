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

export const productMedia = pgTable(
  'product_media',
  {
    id: serial('id').primaryKey(),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 20 }).notNull().default('image'), // 'image' | 'video'
    url: text('url').notNull(),
    alt: varchar('alt', { length: 255 }),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('product_media_product_id_idx').on(table.productId),
    index('product_media_sort_order_idx').on(table.productId, table.sortOrder),
  ]
);

export const productMediaRelations = relations(productMedia, ({ one }) => ({
  product: one(products, {
    fields: [productMedia.productId],
    references: [products.id],
  }),
}));
