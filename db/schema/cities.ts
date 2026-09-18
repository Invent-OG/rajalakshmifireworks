import {
  pgTable,
  varchar,
  integer,
  boolean,
  timestamp,
  serial,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { states } from './states';
import { deliveryPartners } from './delivery-partners';

export const cities = pgTable(
  'cities',
  {
    id: serial('id').primaryKey(),
    stateId: integer('state_id')
      .notNull()
      .references(() => states.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('cities_state_id_idx').on(table.stateId),
    index('cities_name_idx').on(table.name),
    index('cities_is_active_idx').on(table.isActive),
  ]
);

export const citiesRelations = relations(cities, ({ one, many }) => ({
  state: one(states, {
    fields: [cities.stateId],
    references: [states.id],
  }),
  deliveryPartners: many(deliveryPartners),
}));

export type City = typeof cities.$inferSelect;
export type NewCity = typeof cities.$inferInsert;
