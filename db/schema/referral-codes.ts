import { pgTable, serial, varchar, numeric, integer, timestamp, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const referralCodes = pgTable('referral_codes', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 40 }).notNull(),
  description: varchar('description', { length: 255 }),
  rewardType: varchar('reward_type', { length: 12 }).notNull().default('PERCENT'),
  rewardValue: numeric('reward_value', { precision: 10, scale: 2 }).notNull(),
  maxDiscount: numeric('max_discount', { precision: 10, scale: 2 }),
  minOrderValue: numeric('min_order_value', { precision: 10, scale: 2 }).notNull().default('0'),
  usageLimit: integer('usage_limit'),
  usageCount: integer('usage_count').notNull().default(0),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex('referral_codes_code_idx').on(table.code), index('referral_codes_active_idx').on(table.isActive)]);

export type ReferralCode = typeof referralCodes.$inferSelect;
