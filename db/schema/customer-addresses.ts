import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  serial,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { customers } from './customers';

export const customerAddresses = pgTable(
  'customer_addresses',
  {
    id: serial('id').primaryKey(),
    customerId: integer('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    label: varchar('label', { length: 100 }), // 'Home', 'Office', etc.
    address: text('address').notNull(),
    city: varchar('city', { length: 100 }).notNull(),
    pincode: varchar('pincode', { length: 10 }).notNull(),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('customer_addresses_customer_id_idx').on(table.customerId),
  ]
);

export const customerAddressesRelations = relations(customerAddresses, ({ one }) => ({
  customer: one(customers, {
    fields: [customerAddresses.customerId],
    references: [customers.id],
  }),
}));
