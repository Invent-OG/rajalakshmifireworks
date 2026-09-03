export const APP_CONFIG = {
  STORE_NAME: process.env.NEXT_PUBLIC_STORE_NAME || 'Rajalakshmi Fireworks',
  STORE_PHONE: process.env.NEXT_PUBLIC_STORE_PHONE || '+919876543210',
  WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919876543210',
  STORE_ADDRESS: process.env.NEXT_PUBLIC_STORE_ADDRESS || 'Sivakasi, Tamil Nadu',
  STORE_EMAIL: process.env.NEXT_PUBLIC_STORE_EMAIL || 'info@rajalakshmifireworks.com',
  CURRENCY_SYMBOL: '₹',
  CURRENCY_CODE: 'INR',
  INVOICE_PREFIX: 'FW',
  ITEMS_PER_PAGE: 20,
  ADMIN_ITEMS_PER_PAGE: 25,
} as const;

// Default settings that get seeded into the database
export const DEFAULT_SETTINGS = {
  MIN_ORDER_VALUE: '500',
  DELIVERY_CHARGE: '50',
  FREE_DELIVERY_ABOVE: '2000',
  MAX_QUANTITY_PER_ITEM: '50',
  ANNOUNCEMENT_BANNER_ENABLED: 'true',
  ANNOUNCEMENT_BANNER_TEXT: 'Direct from Sivakasi • 100% Genuine Factory Sealed Fireworks • Wholesale Pricing',
  ANNOUNCEMENT_BANNER_LINK: '/products',
  ANNOUNCEMENT_BANNER_VARIANT: 'rainbow',
} as const;

export type SettingKey = keyof typeof DEFAULT_SETTINGS;
