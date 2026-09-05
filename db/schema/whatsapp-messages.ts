import {
  pgTable,
  text,
  varchar,
  integer,
  timestamp,
  serial,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { orders } from './orders';
import { customers } from './customers';

export type WhatsAppMessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export const whatsappMessages = pgTable(
  'whatsapp_messages',
  {
    id: serial('id').primaryKey(),
    orderId: integer('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    customerId: integer('customer_id').references(() => customers.id, {
      onDelete: 'set null',
    }),
    phoneNumber: varchar('phone_number', { length: 25 }).notNull(),
    messageType: varchar('message_type', { length: 50 }).notNull(), // 'ORDER_RECEIVED' | 'ORDER_CONFIRMED' | ...
    templateName: varchar('template_name', { length: 100 }).notNull(),
    providerMessageId: varchar('provider_message_id', { length: 150 }), // Meta's wamid.HBg...
    status: varchar('status', { length: 30 }).notNull().default('PENDING'),
    errorCode: varchar('error_code', { length: 50 }),
    errorMessage: text('error_message'),
    attemptCount: integer('attempt_count').notNull().default(1),
    lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    readAt: timestamp('read_at', { withTimezone: true }),
    failedAt: timestamp('failed_at', { withTimezone: true }),
    payloadSnapshot: jsonb('payload_snapshot'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('whatsapp_messages_order_id_idx').on(table.orderId),
    index('whatsapp_messages_customer_id_idx').on(table.customerId),
    index('whatsapp_messages_provider_message_id_idx').on(table.providerMessageId),
    index('whatsapp_messages_status_idx').on(table.status),
    index('whatsapp_messages_message_type_idx').on(table.messageType),
    index('whatsapp_messages_created_at_idx').on(table.createdAt),
    index('whatsapp_messages_order_type_idx').on(table.orderId, table.messageType),
  ]
);

export const whatsappMessagesRelations = relations(whatsappMessages, ({ one }) => ({
  order: one(orders, {
    fields: [whatsappMessages.orderId],
    references: [orders.id],
  }),
  customer: one(customers, {
    fields: [whatsappMessages.customerId],
    references: [customers.id],
  }),
}));
