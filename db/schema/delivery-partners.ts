import {
  pgTable,
  text,
  varchar,
  timestamp,
  serial,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { orders } from './orders';
import { orderDeliveryAssignments } from './order-delivery-assignments';

export type DeliveryPartnerStatus = 'ACTIVE' | 'INACTIVE';

export const deliveryPartners = pgTable(
  'delivery_partners',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    mobileNumber: varchar('mobile_number', { length: 20 }).notNull(),
    email: varchar('email', { length: 255 }),
    address: text('address'),
    pincode: varchar('pincode', { length: 10 }),
    vehicleType: varchar('vehicle_type', { length: 50 }),
    vehicleNumber: varchar('vehicle_number', { length: 30 }),
    notes: text('notes'),
    status: varchar('status', { length: 20 }).notNull().default('ACTIVE'), // 'ACTIVE' | 'INACTIVE'
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('delivery_partners_status_idx').on(table.status),
    index('delivery_partners_mobile_idx').on(table.mobileNumber),
    index('delivery_partners_name_idx').on(table.name),
  ]
);

export const deliveryPartnersRelations = relations(deliveryPartners, ({ many }) => ({
  orders: many(orders),
  assignments: many(orderDeliveryAssignments),
}));

export type DeliveryPartner = typeof deliveryPartners.$inferSelect;
export type NewDeliveryPartner = typeof deliveryPartners.$inferInsert;
