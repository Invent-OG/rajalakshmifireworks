import {
  pgTable,
  serial,
  varchar,
  timestamp,
  boolean,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { orders } from './orders';

export const salesAgents = pgTable(
  'sales_agents',
  {
    id: serial('id').primaryKey(),
    agentCode: varchar('agent_code', { length: 30 }).notNull(), // Unique agent ID e.g. AGT-001
    name: varchar('name', { length: 255 }).notNull(),
    referralCode: varchar('referral_code', { length: 50 }).notNull(), // Unique uppercase referral code e.g. GUNA01
    mobile: varchar('mobile', { length: 20 }).notNull(),
    email: varchar('email', { length: 255 }),
    location: varchar('location', { length: 255 }),
    joiningDate: timestamp('joining_date', { withTimezone: true }).notNull().defaultNow(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('sales_agents_agent_code_idx').on(table.agentCode),
    uniqueIndex('sales_agents_referral_code_idx').on(table.referralCode),
    index('sales_agents_is_active_idx').on(table.isActive),
    index('sales_agents_mobile_idx').on(table.mobile),
    index('sales_agents_joining_date_idx').on(table.joiningDate),
  ]
);

export const salesAgentsRelations = relations(salesAgents, ({ many }) => ({
  orders: many(orders),
}));

export type SalesAgent = typeof salesAgents.$inferSelect;
export type NewSalesAgent = typeof salesAgents.$inferInsert;
