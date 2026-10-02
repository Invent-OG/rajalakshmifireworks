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
  ORDER_ASSIGNED: process.env.WHATSAPP_TEMPLATE_ORDER_ASSIGNED || 'order_assigned',
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
 * Formats a clean, readable summary of products and quantities.
 * Example: "10cm Sparklers (x2), Flower Pots Big (x1), Ground Chakkars (x3)"
 */
export function formatOrderProductsSummary(
  order: WhatsAppOrderDetails,
  maxItems: number = 8
): string {
  if (!order.items || order.items.length === 0) return '';
  const displayed = order.items.slice(0, maxItems);
  const remaining = order.items.length - maxItems;
  const summary = displayed
    .map((item) => `${item.productNameSnapshot} (x${item.quantity})`)
    .join(', ');
  return remaining > 0 ? `${summary} + ${remaining} more items` : summary;
}

/**
 * Formats a concise quotation breakdown:
 * Example: "₹2,450.00 (Subtotal: ₹2,400 + Delivery: ₹50)"
 */
export function formatQuotationSummary(order: WhatsAppOrderDetails): string {
  const total = formatCurrency(toNumber(order.totalAmount));
  const subtotal = formatCurrency(toNumber(order.subtotal));
  const delivery = toNumber(order.deliveryCharge);
  const discount = toNumber(order.discountAmount);

  const parts: string[] = [];
  parts.push(`Subtotal: ${subtotal}`);
  if (discount > 0) {
    parts.push(`Discount: -${formatCurrency(discount)}`);
  }
  if (delivery > 0) {
    parts.push(`Delivery: ${formatCurrency(delivery)}`);
  }

  if (parts.length > 0 && order.items && order.items.length > 0) {
    return `${total} (${parts.join(', ')})`;
  }
  return total;
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
  const productsSummary = formatOrderProductsSummary(order);
  const quotationText = formatQuotationSummary(order);

  switch (messageType) {
    case 'ORDER_RECEIVED': {
      const fulfillmentText = productsSummary
        ? `${fulfillment} | Products: ${productsSummary}`
        : fulfillment;
      return [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: customerName },
            { type: 'text', text: invoiceNumber },
            { type: 'text', text: totalAmount },
            { type: 'text', text: fulfillmentText },
            { type: 'text', text: storeName },
          ],
        },
      ];
    }

    case 'ORDER_CONFIRMED': {
      const fulfillmentText = productsSummary
        ? `${fulfillment} | Products: ${productsSummary}`
        : fulfillment;
      return [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: customerName },
            { type: 'text', text: invoiceNumber },
            { type: 'text', text: quotationText },
            { type: 'text', text: fulfillmentText },
          ],
        },
      ];
    }

    case 'ORDER_ASSIGNED': {
      const partnerText = order.deliveryPartner
        ? `${order.deliveryPartner.name} (${order.deliveryPartner.mobileNumber})${
            order.deliveryPartner.vehicleNumber ? ` [${order.deliveryPartner.vehicleNumber}]` : ''
          }`
        : 'Delivery Partner Assigned';
      const detailsText = productsSummary
        ? `Products: ${productsSummary} | Total: ${totalAmount}`
        : `Total: ${totalAmount} (${fulfillment})`;
      return [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: customerName },
            { type: 'text', text: invoiceNumber },
            { type: 'text', text: partnerText },
            { type: 'text', text: detailsText },
          ],
        },
      ];
    }

    case 'ORDER_PACKED': {
      const fulfillmentText = productsSummary
        ? `${fulfillment} | Products: ${productsSummary}`
        : fulfillment;
      return [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: customerName },
            { type: 'text', text: invoiceNumber },
            { type: 'text', text: fulfillmentText },
          ],
        },
      ];
    }

    case 'ORDER_OUT_FOR_DELIVERY': {
      const baseAddress = order.addressSnapshot
        ? `${order.addressSnapshot.address}, ${order.addressSnapshot.city} - ${order.addressSnapshot.pincode}`
        : 'your registered address';
      const addressText = productsSummary
        ? `${baseAddress} | Products: ${productsSummary} (Total: ${totalAmount})`
        : baseAddress;
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

    case 'ORDER_DELIVERED': {
      const storeText = productsSummary
        ? `${storeName} | Delivered Products: ${productsSummary} (Total: ${totalAmount})`
        : storeName;
      return [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: customerName },
            { type: 'text', text: invoiceNumber },
            { type: 'text', text: storeText },
          ],
        },
      ];
    }

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
