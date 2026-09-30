const getEnv = (key: string, fallback: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key]!;
  }
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env as any)[key]) {
      return (import.meta.env as any)[key];
    }
  } catch {}
  return fallback;
};

export const APP_CONFIG = {
  STORE_NAME: getEnv('NEXT_PUBLIC_STORE_NAME', 'Rajalakshmi Fireworks'),
  STORE_PHONE: getEnv('NEXT_PUBLIC_STORE_PHONE', '+919876543210'),
  WHATSAPP_NUMBER: getEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', '919876543210'),
  STORE_ADDRESS: getEnv('NEXT_PUBLIC_STORE_ADDRESS', 'Sivakasi, Tamil Nadu'),
  STORE_EMAIL: getEnv('NEXT_PUBLIC_STORE_EMAIL', 'info@rajalakshmifireworks.com'),
  STORE_TAGLINE: getEnv('NEXT_PUBLIC_STORE_TAGLINE', 'Direct Sivakasi Fireworks • 100% Genuine Green Crackers'),
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
