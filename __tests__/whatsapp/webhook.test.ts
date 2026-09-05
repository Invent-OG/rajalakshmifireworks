import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/whatsapp/webhook/route';
import { _resetWhatsAppConfigCache } from '@/lib/whatsapp/config';

describe('WhatsApp Webhook Route Handler', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.WHATSAPP_VERIFY_TOKEN = 'secret_webhook_verify_token_xyz';
    _resetWhatsAppConfigCache();
  });

  afterEach(() => {
    process.env = originalEnv;
    _resetWhatsAppConfigCache();
  });

  describe('GET Verification', () => {
    it('returns challenge with 200 when verify token matches', async () => {
      const url = new URL(
        'http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=secret_webhook_verify_token_xyz&hub.challenge=11582012'
      );
      const req = new NextRequest(url);

      const res = await GET(req);
      expect(res.status).toBe(200);
      const body = await res.text();
      expect(body).toBe('11582012');
    });

    it('returns 403 when verify token does not match', async () => {
      const url = new URL(
        'http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=11582012'
      );
      const req = new NextRequest(url);

      const res = await GET(req);
      expect(res.status).toBe(403);
    });

    it('returns 403 when hub.mode is not subscribe', async () => {
      const url = new URL(
        'http://localhost:3000/api/whatsapp/webhook?hub.mode=other&hub.verify_token=secret_webhook_verify_token_xyz&hub.challenge=11582012'
      );
      const req = new NextRequest(url);

      const res = await GET(req);
      expect(res.status).toBe(403);
    });
  });

  describe('POST Event Ingestion', () => {
    it('handles malformed JSON gracefully with 400', async () => {
      const req = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        body: 'invalid-json',
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('handles unrecognized payload safely with 200 status', async () => {
      const req = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        body: JSON.stringify({ object: 'unknown_type' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe('ignored');
    });
  });
});
