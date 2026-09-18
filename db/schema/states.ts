import {
  pgTable,
  varchar,
  boolean,
  timestamp,
  serial,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { cities } from './cities';
import { deliveryPartners } from './delivery-partners';

export const states = pgTable(
  'states',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    code: varchar('code', { length: 10 }).notNull(), // e.g. 'TN', 'KL', 'KA'
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('states_code_idx').on(table.code),
    index('states_name_idx').on(table.name),
    index('states_is_active_idx').on(table.isActive),
  ]
);

export const statesRelations = relations(states, ({ many }) => ({
  cities: many(cities),
  deliveryPartners: many(deliveryPartners),
}));

export type State = typeof states.$inferSelect;
export type NewState = typeof states.$inferInsert;
