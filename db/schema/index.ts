// Barrel export for all database schemas
export { categories, categoriesRelations } from './categories';
export { products, productsRelations } from './products';
export { productMedia, productMediaRelations } from './product-media';
export { customers, customersRelations } from './customers';
export { customerAddresses, customerAddressesRelations } from './customer-addresses';
export { orders, ordersRelations } from './orders';
export type { OrderStatus, FulfillmentType } from './orders';
export { orderItems, orderItemsRelations } from './order-items';
export { orderStatusHistory, orderStatusHistoryRelations } from './order-status-history';
export { inventoryTransactions, inventoryTransactionsRelations } from './inventory-transactions';
export type { InventoryTransactionType } from './inventory-transactions';
export { adminUsers } from './admin-users';
export { settings } from './settings';
export { whatsappMessages, whatsappMessagesRelations } from './whatsapp-messages';
export type { WhatsAppMessageStatus } from './whatsapp-messages';
