import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  normalizePhoneNumber,
  maskPhoneNumber,
  verifyWebhookSignature,
} from '@/lib/whatsapp/validation';
import { WhatsAppValidationError } from '@/lib/whatsapp/errors';

describe('WhatsApp Validation & Normalization', () => {
  describe('normalizePhoneNumber', () => {
    it('normalizes standard 10-digit Indian numbers with 91 prefix', () => {
      expect(normalizePhoneNumber('9876543210')).toBe('919876543210');
      expect(normalizePhoneNumber('8123456789')).toBe('918123456789');
      expect(normalizePhoneNumber('7000000001')).toBe('917000000001');
      expect(normalizePhoneNumber('6380000000')).toBe('916380000000');
    });

    it('handles Indian numbers with leading 0', () => {
      expect(normalizePhoneNumber('09876543210')).toBe('919876543210');
    });

    it('handles Indian numbers already formatted with +91 or 91', () => {
      expect(normalizePhoneNumber('+91 9876543210')).toBe('919876543210');
      expect(normalizePhoneNumber('+91-98765-43210')).toBe('919876543210');
      expect(normalizePhoneNumber('919876543210')).toBe('919876543210');
    });

    it('normalizes international numbers correctly without duplicating prefix', () => {
      expect(normalizePhoneNumber('+1 (415) 555-2671')).toBe('14155552671');
      expect(normalizePhoneNumber('+44 7911 123456')).toBe('447911123456');
      expect(normalizePhoneNumber('+65 9123 4567')).toBe('6591234567');
    });

    it('throws WhatsAppValidationError for empty or non-digit input', () => {
      expect(() => normalizePhoneNumber('')).toThrow(WhatsAppValidationError);
      expect(() => normalizePhoneNumber('abc')).toThrow(WhatsAppValidationError);
      expect(() => normalizePhoneNumber('---')).toThrow(WhatsAppValidationError);
    });

    it('throws WhatsAppValidationError for invalid short numbers', () => {
      expect(() => normalizePhoneNumber('12345')).toThrow(WhatsAppValidationError);
      expect(() => normalizePhoneNumber('9876')).toThrow(WhatsAppValidationError);
    });
  });

  describe('maskPhoneNumber', () => {
    it('masks phone numbers safely for log outputs', () => {
      expect(maskPhoneNumber('919876543210')).toBe('91987****210');
      expect(maskPhoneNumber('+91 98765 43210')).toBe('91987****210');
      expect(maskPhoneNumber(null)).toBe('N/A');
    });
  });

  describe('verifyWebhookSignature', () => {
    const secret = 'super_secret_app_key_123';
    const payload = JSON.stringify({ object: 'whatsapp_business_account' });

    it('validates authentic signature matching secret and payload', () => {
      const hash = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
      const signatureHeader = `sha256=${hash}`;

      expect(verifyWebhookSignature(payload, signatureHeader, secret)).toBe(true);
    });

    it('rejects tampered payload', () => {
      const hash = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
      const signatureHeader = `sha256=${hash}`;
      const tamperedPayload = JSON.stringify({ object: 'whatsapp_business_account', tampered: true });

      expect(verifyWebhookSignature(tamperedPayload, signatureHeader, secret)).toBe(false);
    });

    it('rejects invalid header format or mismatched key', () => {
      expect(verifyWebhookSignature(payload, 'invalid_header', secret)).toBe(false);
      expect(verifyWebhookSignature(payload, 'sha256=123456', secret)).toBe(false);
      expect(verifyWebhookSignature(payload, null, secret)).toBe(false);
    });
  });
});
