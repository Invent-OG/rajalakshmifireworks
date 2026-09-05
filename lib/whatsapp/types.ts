/**
 * Core type definitions for Meta WhatsApp Cloud API integration
 */

export type WhatsAppMessageType =
  | 'ORDER_RECEIVED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_PACKED'
  | 'ORDER_OUT_FOR_DELIVERY'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED';

export type WhatsAppMessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export type ErrorClassification = 'RETRYABLE' | 'NON_RETRYABLE' | 'CONFIGURATION_ERROR';

export interface WhatsAppTemplateParameter {
  type: 'text' | 'currency' | 'date_time' | 'image' | 'document';
  text?: string;
  currency?: {
    fallback_value: string;
    code: string;
    amount_1000: number;
  };
  date_time?: {
    fallback_value: string;
  };
}

export interface WhatsAppTemplateComponent {
  type: 'header' | 'body' | 'button';
  sub_type?: 'url' | 'quick_reply';
  index?: string | number;
  parameters: WhatsAppTemplateParameter[];
}

export interface MetaSendTemplatePayload {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string; // E.164 formatted number without '+'
  type: 'template';
  template: {
    name: string;
    language: {
      code: string; // e.g., 'en', 'en_US', 'ta'
    };
    components: WhatsAppTemplateComponent[];
  };
}

export interface MetaSuccessContact {
  input: string;
  wa_id: string;
}

export interface MetaSuccessMessage {
  id: string; // e.g. "wamid.HBg..."
  message_status?: string;
}

export interface MetaSendSuccessResponse {
  messaging_product: 'whatsapp';
  contacts: MetaSuccessContact[];
  messages: MetaSuccessMessage[];
}

export interface MetaApiErrorData {
  message: string;
  type: string;
  code: number;
  error_subcode?: number;
  error_data?: {
    details?: string;
    messaging_product?: string;
  };
  fbtrace_id?: string;
}

export interface MetaSendErrorResponse {
  error: MetaApiErrorData;
}

// Webhook Types
export interface MetaWebhookStatusError {
  code: number;
  title: string;
  message?: string;
  error_data?: {
    details?: string;
  };
}

export interface MetaWebhookStatusItem {
  id: string; // wamid.HBg...
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  conversation?: {
    id: string;
    origin?: {
      type: string;
    };
    expiration_timestamp?: string;
  };
  pricing?: {
    billable: boolean;
    pricing_model: string;
    category: string;
  };
  errors?: MetaWebhookStatusError[];
}

export interface MetaWebhookMessageItem {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: {
    body: string;
  };
}

export interface MetaWebhookChangeValue {
  messaging_product: 'whatsapp';
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: Array<{
    profile: {
      name: string;
    };
    wa_id: string;
  }>;
  messages?: MetaWebhookMessageItem[];
  statuses?: MetaWebhookStatusItem[];
  errors?: MetaWebhookStatusError[];
}

export interface MetaWebhookEntry {
  id: string;
  changes: Array<{
    value: MetaWebhookChangeValue;
    field: string;
  }>;
}

export interface MetaWebhookPayload {
  object: 'whatsapp_business_account';
  entry: MetaWebhookEntry[];
}

// Internal Result Types
export interface SendWhatsAppResult {
  success: boolean;
  messageId?: number;
  providerMessageId?: string;
  status: WhatsAppMessageStatus;
  classification?: ErrorClassification;
  errorCode?: string;
  errorMessage?: string;
  attemptCount: number;
}

// Order data shape required by WhatsApp service
export interface WhatsAppOrderDetails {
  id: number;
  invoiceNumber: string;
  customerId: number;
  customerNameSnapshot: string;
  customerMobileSnapshot: string;
  fulfillmentType: 'DELIVERY' | 'PICKUP' | string;
  totalAmount: string | number;
  subtotal: string | number;
  discountAmount: string | number;
  deliveryCharge: string | number;
  addressSnapshot?: { address: string; city: string; pincode: string } | null;
  items?: Array<{
    productNameSnapshot: string;
    quantity: number;
    sellingPriceSnapshot: string | number;
    lineTotal: string | number;
  }>;
  placedAt?: Date | string;
}
