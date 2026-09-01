import {
  pgTable,
  varchar,
  timestamp,
  serial,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const adminUsers = pgTable(
  'admin_users',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    role: varchar('role', { length: 50 }).notNull().default('admin'), // 'admin' | 'superadmin'
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('admin_users_email_idx').on(table.email),
  ]
);
