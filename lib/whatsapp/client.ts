import { getWhatsAppConfig } from './config';
import {
  WhatsAppApiError,
  WhatsAppConfigError,
  WhatsAppTimeoutError,
} from './errors';
import { maskPhoneNumber } from './validation';
import { logger } from '@/lib/utils/logger';
import type {
  MetaSendTemplatePayload,
  MetaSendSuccessResponse,
  MetaSendErrorResponse,
} from './types';

export interface SendTemplateResponse {
  providerMessageId: string;
  recipientWaId: string;
}

const DEFAULT_TIMEOUT_MS = 10000; // 10 seconds
const MAX_AUTO_RETRIES = 2; // Maximum automatic retries for transient HTTP failures

/**
 * Meta WhatsApp Cloud API Client.
 * Handles authenticated Graph API communication, request timeouts,
 * safe token redacting, and transient network retry backoff.
 */
export class MetaWhatsAppClient {
  /**
   * Send a pre-approved Meta WhatsApp Template message.
   */
  async sendTemplateMessage(
    payload: MetaSendTemplatePayload
  ): Promise<SendTemplateResponse> {
    const config = getWhatsAppConfig();

    // Development / Mock mode handling
    if (config.isMockMode || !config.isConfigured) {
      const mockWamid = `wamid.mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      logger.info('whatsapp.client', '[MOCK] Simulated WhatsApp template send', {
        template: payload.template.name,
        recipient: maskPhoneNumber(payload.to),
        mockProviderMessageId: mockWamid,
      });

      return {
        providerMessageId: mockWamid,
        recipientWaId: payload.to,
      };
    }

    if (!config.accessToken || !config.phoneNumberId) {
      throw new WhatsAppConfigError(
        'WhatsApp Cloud API credentials (WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID) are missing'
      );
    }

    const endpoint = `${config.baseUrl}/messages`;
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= MAX_AUTO_RETRIES) {
      attempt++;
      try {
        const response = await this.executeFetch(endpoint, config.accessToken, payload);
        return response;
      } catch (error) {
        lastError = error as Error;

        // Only retry if it is classified as RETRYABLE
        const isRetryable =
          error instanceof WhatsAppTimeoutError ||
          (error instanceof WhatsAppApiError && error.classification === 'RETRYABLE');

        if (isRetryable && attempt <= MAX_AUTO_RETRIES) {
          const backoffMs = Math.min(500 * Math.pow(2, attempt - 1) + Math.random() * 200, 3000);
          logger.warn('whatsapp.client', `Transient error on attempt ${attempt}. Retrying in ${Math.round(backoffMs)}ms...`, {
            template: payload.template.name,
            recipient: maskPhoneNumber(payload.to),
            error: lastError.message,
          });
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          continue;
        }

        break;
      }
    }

    throw lastError || new Error('Unknown WhatsApp client error');
  }

  /**
   * Internal fetch with timeout and error parsing.
   */
  private async executeFetch(
    url: string,
    accessToken: string,
    payload: MetaSendTemplatePayload
  ): Promise<SendTemplateResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseJson = await res.json().catch(() => null);

      if (!res.ok) {
        const errorData = (responseJson as MetaSendErrorResponse)?.error;
        const errorMessage = errorData?.message || `WhatsApp API error: HTTP ${res.status}`;
        const metaCode = errorData?.code;
        const metaSubcode = errorData?.error_subcode;
        const fbtraceId = errorData?.fbtrace_id;

        logger.error('whatsapp.client', 'Meta Graph API call failed', {
          httpStatus: res.status,
          metaCode,
          metaSubcode,
          fbtraceId,
          recipient: maskPhoneNumber(payload.to),
          template: payload.template.name,
        });

        throw new WhatsAppApiError(errorMessage, res.status, metaCode, metaSubcode, fbtraceId);
      }

      const successData = responseJson as MetaSendSuccessResponse;
      const providerMessageId = successData.messages?.[0]?.id || '';
      const recipientWaId = successData.contacts?.[0]?.wa_id || payload.to;

      logger.info('whatsapp.client', 'WhatsApp message dispatched successfully', {
        providerMessageId,
        recipient: maskPhoneNumber(payload.to),
        template: payload.template.name,
      });

      return {
        providerMessageId,
        recipientWaId,
      };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof WhatsAppApiError || err instanceof WhatsAppConfigError) {
        throw err;
      }
      if ((err as Error)?.name === 'AbortError') {
        throw new WhatsAppTimeoutError(`Request timed out after ${DEFAULT_TIMEOUT_MS}ms`);
      }
      throw new WhatsAppApiError((err as Error)?.message || 'Network request failed', 500);
    }
  }
}

export const whatsAppClient = new MetaWhatsAppClient();
