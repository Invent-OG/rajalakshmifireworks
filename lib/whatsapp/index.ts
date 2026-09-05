export { whatsAppService, WhatsAppService } from './service';
export { whatsAppClient, MetaWhatsAppClient } from './client';
export { getWhatsAppConfig } from './config';
export { WHATSAPP_TEMPLATES, buildMetaTemplatePayload } from './templates';
export {
  normalizePhoneNumber,
  maskPhoneNumber,
  verifyWebhookSignature,
  parseWebhookPayload,
} from './validation';
export {
  WhatsAppError,
  WhatsAppApiError,
  WhatsAppValidationError,
  WhatsAppConfigError,
  WhatsAppTimeoutError,
  classifyMetaError,
} from './errors';
export type {
  WhatsAppMessageType,
  WhatsAppMessageStatus,
  ErrorClassification,
  SendWhatsAppResult,
  WhatsAppOrderDetails,
  MetaWebhookPayload,
} from './types';
