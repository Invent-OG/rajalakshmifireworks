import { z } from 'zod';
import { logger } from '@/lib/utils/logger';

const whatsappEnvSchema = z.object({
  WHATSAPP_ACCESS_TOKEN: z.string().min(1).optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).optional(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().min(1).optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().min(1).optional(),
  WHATSAPP_API_VERSION: z.string().default('v22.0'),
  WHATSAPP_APP_SECRET: z.string().optional(),
  WHATSAPP_MOCK_MODE: z
    .enum(['true', 'false', '1', '0'])
    .optional()
    .transform((val) => val === 'true' || val === '1'),
});

type WhatsAppConfig = {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  verifyToken: string;
  apiVersion: string;
  appSecret?: string;
  isMockMode: boolean;
  isConfigured: boolean;
  baseUrl: string;
};

let cachedConfig: WhatsAppConfig | null = null;

export function getWhatsAppConfig(): WhatsAppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const parsed = whatsappEnvSchema.safeParse({
    WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_BUSINESS_ACCOUNT_ID: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN,
    WHATSAPP_API_VERSION: process.env.WHATSAPP_API_VERSION || 'v22.0',
    WHATSAPP_APP_SECRET: process.env.WHATSAPP_APP_SECRET,
    WHATSAPP_MOCK_MODE: process.env.WHATSAPP_MOCK_MODE,
  });

  const raw = parsed.success ? parsed.data : {
    WHATSAPP_ACCESS_TOKEN: undefined,
    WHATSAPP_PHONE_NUMBER_ID: undefined,
    WHATSAPP_BUSINESS_ACCOUNT_ID: undefined,
    WHATSAPP_VERIFY_TOKEN: undefined,
    WHATSAPP_API_VERSION: 'v22.0',
    WHATSAPP_APP_SECRET: undefined,
    WHATSAPP_MOCK_MODE: false,
  };

  const accessToken = raw.WHATSAPP_ACCESS_TOKEN || '';
  const phoneNumberId = raw.WHATSAPP_PHONE_NUMBER_ID || '';
  const businessAccountId = raw.WHATSAPP_BUSINESS_ACCOUNT_ID || '';
  const verifyToken = raw.WHATSAPP_VERIFY_TOKEN || '';
  const apiVersion = raw.WHATSAPP_API_VERSION || 'v22.0';
  const appSecret = raw.WHATSAPP_APP_SECRET;

  const isConfigured = Boolean(accessToken && phoneNumberId);
  const isMockMode = Boolean(raw.WHATSAPP_MOCK_MODE || (!isConfigured && process.env.NODE_ENV !== 'production'));

  if (!isConfigured && process.env.NODE_ENV === 'production') {
    logger.error('whatsapp.config', 'Meta WhatsApp Cloud API credentials missing in production environment');
  } else if (!isConfigured) {
    logger.info('whatsapp.config', 'WhatsApp running in mock/development mode (credentials not configured)');
  }

  cachedConfig = {
    accessToken,
    phoneNumberId,
    businessAccountId,
    verifyToken,
    apiVersion,
    appSecret,
    isMockMode,
    isConfigured,
    baseUrl: `https://graph.facebook.com/${apiVersion}/${phoneNumberId}`,
  };

  return cachedConfig;
}

/**
 * Reset config cache (primarily for tests)
 */
export function _resetWhatsAppConfigCache(): void {
  cachedConfig = null;
}
