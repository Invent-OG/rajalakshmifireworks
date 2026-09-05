import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MetaWhatsAppClient } from '@/lib/whatsapp/client';
import { classifyMetaError, WhatsAppApiError } from '@/lib/whatsapp/errors';
import { _resetWhatsAppConfigCache } from '@/lib/whatsapp/config';

describe('Meta WhatsApp Client & Error Classification', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    _resetWhatsAppConfigCache();
  });

  afterEach(() => {
    process.env = originalEnv;
    _resetWhatsAppConfigCache();
    vi.restoreAllMocks();
  });

  describe('classifyMetaError', () => {
    it('classifies 429 and rate limit codes as RETRYABLE', () => {
      expect(classifyMetaError(429)).toBe('RETRYABLE');
      expect(classifyMetaError(200, 130429)).toBe('RETRYABLE');
      expect(classifyMetaError(200, 80007)).toBe('RETRYABLE');
    });

    it('classifies 5xx server errors as RETRYABLE', () => {
      expect(classifyMetaError(500)).toBe('RETRYABLE');
      expect(classifyMetaError(503)).toBe('RETRYABLE');
    });

    it('classifies 401 and authentication errors as CONFIGURATION_ERROR', () => {
      expect(classifyMetaError(401)).toBe('CONFIGURATION_ERROR');
      expect(classifyMetaError(400, 190)).toBe('CONFIGURATION_ERROR');
      expect(classifyMetaError(400, 10)).toBe('CONFIGURATION_ERROR');
      expect(classifyMetaError(400, 131031)).toBe('CONFIGURATION_ERROR');
    });

    it('classifies template parameter hydration errors as NON_RETRYABLE', () => {
      expect(classifyMetaError(400, 131026)).toBe('NON_RETRYABLE');
      expect(classifyMetaError(400, 132000)).toBe('NON_RETRYABLE');
      expect(classifyMetaError(400, 131051)).toBe('NON_RETRYABLE');
    });
  });

  describe('MetaWhatsAppClient in Mock Mode', () => {
    it('generates simulated response without network requests when unconfigured', async () => {
      process.env.WHATSAPP_ACCESS_TOKEN = '';
      process.env.WHATSAPP_PHONE_NUMBER_ID = '';
      process.env.WHATSAPP_MOCK_MODE = 'true';
      _resetWhatsAppConfigCache();

      const client = new MetaWhatsAppClient();
      const result = await client.sendTemplateMessage({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '919876543210',
        type: 'template',
        template: {
          name: 'order_received',
          language: { code: 'en' },
          components: [],
        },
      });

      expect(result.providerMessageId).toMatch(/^wamid\.mock_/);
      expect(result.recipientWaId).toBe('919876543210');
    });
  });
});
