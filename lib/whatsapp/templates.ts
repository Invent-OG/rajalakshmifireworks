import { APP_CONFIG } from '@/lib/constants/config';
import { formatCurrency, toNumber } from '@/lib/utils/format';
import type {
  WhatsAppMessageType,
  WhatsAppOrderDetails,
  MetaSendTemplatePayload,
  WhatsAppTemplateComponent,
} from './types';

/**
 * Centralized Meta WhatsApp template registry.
 * All template names match Meta WhatsApp Business Manager approved templates under the UTILITY category.
 */
export const WHATSAPP_TEMPLATES = {
  ORDER_RECEIVED: process.env.WHATSAPP_TEMPLATE_ORDER_RECEIVED || 'order_received',
  ORDER_CONFIRMED: process.env.WHATSAPP_TEMPLATE_ORDER_CONFIRMED || 'order_confirmed',
  ORDER_PACKED: process.env.WHATSAPP_TEMPLATE_ORDER_PACKED || 'order_packed',
  ORDER_OUT_FOR_DELIVERY: process.env.WHATSAPP_TEMPLATE_OUT_FOR_DELIVERY || 'order_out_for_delivery',
  ORDER_DELIVERED: process.env.WHATSAPP_TEMPLATE_ORDER_DELIVERED || 'order_delivered',
  ORDER_CANCELLED: process.env.WHATSAPP_TEMPLATE_ORDER_CANCELLED || 'order_cancelled',
} as const;

export const DEFAULT_LANGUAGE_CODE = process.env.WHATSAPP_LANGUAGE_CODE || 'en';

/**
 * Formats fulfillment description string.
 */
function getFulfillmentSummary(order: WhatsAppOrderDetails): string {
  if (order.fulfillmentType === 'DELIVERY') {
    if (order.addressSnapshot) {
      return `Doorstep Delivery (${order.addressSnapshot.city} - ${order.addressSnapshot.pincode})`;
    }
    return 'Doorstep Delivery';
  }
  return 'Store Counter Pickup (Sivakasi)';
}

/**
 * Builds Meta Template Components for the requested message type.
 * Utility Category Templates: strictly transactional, concise, with zero marketing clutter.
 */
export function buildTemplateComponents(
  messageType: WhatsAppMessageType,
  order: WhatsAppOrderDetails
): WhatsAppTemplateComponent[] {
  const customerName = order.customerNameSnapshot.trim();
  const invoiceNumber = order.invoiceNumber.trim();
  const totalAmount = formatCurrency(toNumber(order.totalAmount));
  const fulfillment = getFulfillmentSummary(order);
  const storeName = APP_CONFIG.STORE_NAME;

  switch (messageType) {
    case 'ORDER_RECEIVED':
      return [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: customerName },
            { type: 'text', text: invoiceNumber },
            { type: 'text', text: totalAmount },
            { type: 'text', text: fulfillment },
            { type: 'text', text: storeName },
          ],
        },
      ];

    case 'ORDER_CONFIRMED':
      return [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: customerName },
            { type: 'text', text: invoiceNumber },
            { type: 'text', text: totalAmount },
            { type: 'text', text: fulfillment },
          ],
        },
      ];

    case 'ORDER_PACKED':
      return [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: customerName },
            { type: 'text', text: invoiceNumber },
            { type: 'text', text: fulfillment },
          ],
        },
      ];

    case 'ORDER_OUT_FOR_DELIVERY': {
      const addressText = order.addressSnapshot
        ? `${order.addressSnapshot.address}, ${order.addressSnapshot.city} - ${order.addressSnapshot.pincode}`
        : 'your registered address';
      return [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: customerName },
            { type: 'text', text: invoiceNumber },
            { type: 'text', text: addressText },
          ],
        },
      ];
    }

    case 'ORDER_DELIVERED':
      return [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: customerName },
            { type: 'text', text: invoiceNumber },
            { type: 'text', text: storeName },
          ],
        },
      ];

    case 'ORDER_CANCELLED':
      return [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: customerName },
            { type: 'text', text: invoiceNumber },
            { type: 'text', text: storeName },
          ],
        },
      ];

    default:
      throw new Error(`Unsupported message type: ${messageType}`);
  }
}

/**
 * Builds the complete Meta Graph API send template payload.
 */
export function buildMetaTemplatePayload(
  recipientPhone: string,
  messageType: WhatsAppMessageType,
  order: WhatsAppOrderDetails,
  languageCode: string = DEFAULT_LANGUAGE_CODE
): { templateName: string; payload: MetaSendTemplatePayload } {
  const templateName = WHATSAPP_TEMPLATES[messageType];
  const components = buildTemplateComponents(messageType, order);

  return {
    templateName,
    payload: {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientPhone,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
        components,
      },
    },
  };
}
