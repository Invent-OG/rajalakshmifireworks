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
import { states } from './states';
import { cities } from './cities';

export const customerAddresses = pgTable(
  'customer_addresses',
  {
    id: serial('id').primaryKey(),
    customerId: integer('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    stateId: integer('state_id').references(() => states.id),
    cityId: integer('city_id').references(() => cities.id),
    label: varchar('label', { length: 100 }), // 'Home', 'Office', etc.
    address: text('address').notNull(),
    city: varchar('city', { length: 100 }).notNull(),
    state: varchar('state', { length: 100 }),
    pincode: varchar('pincode', { length: 10 }).notNull(),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('customer_addresses_customer_id_idx').on(table.customerId),
    index('customer_addresses_state_id_idx').on(table.stateId),
    index('customer_addresses_city_id_idx').on(table.cityId),
  ]
);

export const customerAddressesRelations = relations(customerAddresses, ({ one }) => ({
  customer: one(customers, {
    fields: [customerAddresses.customerId],
    references: [customers.id],
  }),
  state: one(states, {
    fields: [customerAddresses.stateId],
    references: [states.id],
  }),
  city: one(cities, {
    fields: [customerAddresses.cityId],
    references: [cities.id],
  }),
}));

export type CustomerAddress = typeof customerAddresses.$inferSelect;
export type NewCustomerAddress = typeof customerAddresses.$inferInsert;
