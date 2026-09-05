import crypto from 'crypto';
import { z } from 'zod';
import { WhatsAppValidationError } from './errors';
import type { MetaWebhookPayload } from './types';

/**
 * Normalizes customer phone number to Meta WhatsApp Cloud API format:
 * International E.164 digits without leading '+' or special characters.
 *
 * Examples:
 * - "9876543210" -> "919876543210" (India 10-digit)
 * - "09876543210" -> "919876543210" (India with leading 0)
 * - "+91 98765-43210" -> "919876543210" (India formatted)
 * - "+1 (415) 555-2671" -> "14155552671" (USA formatted)
 * - "447911123456" -> "447911123456" (UK)
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    throw new WhatsAppValidationError('Phone number is required');
  }

  const trimmed = phone.trim();
  const isExplicitInternational = trimmed.startsWith('+') || trimmed.startsWith('00');

  // Strip all non-digit characters
  let digits = trimmed.replace(/\D/g, '');

  if (!digits) {
    throw new WhatsAppValidationError('Invalid phone number format: no digits found');
  }

  // If international prefix (00) was used, strip leading 00
  if (trimmed.startsWith('00') && digits.startsWith('00')) {
    digits = digits.substring(2);
  }

  if (isExplicitInternational) {
    // If entered with explicit '+' or '00', keep digits as is (country code already present)
  } else {
    // Handle leading 0 for domestic numbers (e.g. 09876543210 -> 9876543210)
    if (digits.length === 11 && digits.startsWith('0')) {
      digits = digits.substring(1);
    }

    // 10-digit domestic Indian number (starting with 6, 7, 8, 9)
    if (digits.length === 10 && /^[6-9]/.test(digits)) {
      digits = `91${digits}`;
    }
  }

  // Handle Indian numbers (length 12 starting with 91)
  if (digits.length === 12 && digits.startsWith('91')) {
    const nationalPart = digits.substring(2);
    if (!/^[6-9]\d{9}$/.test(nationalPart)) {
      throw new WhatsAppValidationError(
        `Invalid Indian mobile number: national number portion must start with 6-9`
      );
    }
  }

  // General E.164 length check (must be between 10 and 15 digits)
  if (digits.length < 10 || digits.length > 15) {
    throw new WhatsAppValidationError(
      `Phone number must be between 10 and 15 digits (got ${digits.length} digits)`
    );
  }

  return digits;
}


/**
 * Mask phone number for secure structured logging.
 * Example: "919876543210" -> "91987****210"
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return 'N/A';
  const clean = phone.replace(/\D/g, '');
  if (clean.length <= 4) return '****';
  const visiblePrefix = clean.slice(0, 5);
  const visibleSuffix = clean.slice(-3);
  return `${visiblePrefix}****${visibleSuffix}`;
}

/**
 * Verifies Meta Webhook payload HMAC-SHA256 signature (X-Hub-Signature-256).
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  appSecret: string
): boolean {
  if (!appSecret) {
    // If no app secret is configured, bypass signature check (warning logged during startup)
    return true;
  }

  if (!signatureHeader) {
    return false;
  }

  const parts = signatureHeader.split('=');
  if (parts.length !== 2 || parts[0] !== 'sha256') {
    return false;
  }

  const expectedSignature = parts[1];
  const calculatedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody, 'utf8')
    .digest('hex');

  try {
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const calculatedBuffer = Buffer.from(calculatedSignature, 'utf8');

    if (expectedBuffer.length !== calculatedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, calculatedBuffer);
  } catch {
    return false;
  }
}

/**
 * Zod schema for validating Meta webhook JSON payload structure safely.
 */
export const metaWebhookSchema = z.object({
  object: z.literal('whatsapp_business_account'),
  entry: z.array(
    z.object({
      id: z.string(),
      changes: z.array(
        z.object({
          field: z.string(),
          value: z.object({
            messaging_product: z.literal('whatsapp'),
            metadata: z.object({
              display_phone_number: z.string().optional(),
              phone_number_id: z.string().optional(),
            }),
            contacts: z.array(z.any()).optional(),
            messages: z.array(z.any()).optional(),
            statuses: z
              .array(
                z.object({
                  id: z.string(),
                  status: z.enum(['sent', 'delivered', 'read', 'failed']),
                  timestamp: z.string(),
                  recipient_id: z.string(),
                  errors: z
                    .array(
                      z.object({
                        code: z.number(),
                        title: z.string(),
                        message: z.string().optional(),
                      })
                    )
                    .optional(),
                })
              )
              .optional(),
            errors: z.array(z.any()).optional(),
          }),
        })
      ),
    })
  ),
});

export function parseWebhookPayload(payload: unknown): MetaWebhookPayload | null {
  const result = metaWebhookSchema.safeParse(payload);
  if (!result.success) {
    return null;
  }
  return result.data as MetaWebhookPayload;
}
