import {
  pgTable,
  varchar,
  timestamp,
  serial,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { customerAddresses } from './customer-addresses';
import { orders } from './orders';

export const customers = pgTable(
  'customers',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    mobile: varchar('mobile', { length: 15 }).notNull(),
    email: varchar('email', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('customers_mobile_idx').on(table.mobile),
    index('customers_name_idx').on(table.name),
  ]
);

export const customersRelations = relations(customers, ({ many }) => ({
  addresses: many(customerAddresses),
  orders: many(orders),
}));
