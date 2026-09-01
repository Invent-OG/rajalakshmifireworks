import {
  pgTable,
  text,
  varchar,
  timestamp,
  serial,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const settings = pgTable(
  'settings',
  {
    id: serial('id').primaryKey(),
    key: varchar('key', { length: 100 }).notNull(),
    value: text('value').notNull(),
    description: varchar('description', { length: 255 }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('settings_key_idx').on(table.key),
  ]
);
