import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  serial,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const categories = pgTable(
  'categories',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),
    image: text('image'),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('categories_slug_idx').on(table.slug),
    index('categories_is_active_idx').on(table.isActive),
    index('categories_sort_order_idx').on(table.sortOrder),
  ]
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

// Forward reference — imported from products.ts but we define the relation here
import { products } from './products';
