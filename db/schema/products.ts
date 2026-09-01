import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  serial,
  numeric,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { categories } from './categories';
import { productMedia } from './product-media';
import { orderItems } from './order-items';
import { inventoryTransactions } from './inventory-transactions';

export const products = pgTable(
  'products',
  {
    id: serial('id').primaryKey(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),
    sku: varchar('sku', { length: 100 }),
    mrp: numeric('mrp', { precision: 10, scale: 2 }).notNull(),
    sellingPrice: numeric('selling_price', { precision: 10, scale: 2 }).notNull(),
    stockQuantity: integer('stock_quantity').notNull().default(0),
    lowStockThreshold: integer('low_stock_threshold').notNull().default(10),
    isActive: boolean('is_active').notNull().default(true),
    isFeatured: boolean('is_featured').notNull().default(false),
    isBestseller: boolean('is_bestseller').notNull().default(false),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('products_slug_idx').on(table.slug),
    index('products_category_id_idx').on(table.categoryId),
    index('products_is_active_idx').on(table.isActive),
    index('products_is_featured_idx').on(table.isFeatured),
    index('products_is_bestseller_idx').on(table.isBestseller),
    index('products_selling_price_idx').on(table.sellingPrice),
    index('products_sku_idx').on(table.sku),
  ]
);

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  media: many(productMedia),
  orderItems: many(orderItems),
  inventoryTransactions: many(inventoryTransactions),
}));
