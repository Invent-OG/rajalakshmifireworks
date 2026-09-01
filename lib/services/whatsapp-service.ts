import { APP_CONFIG } from '@/lib/constants/config';
import { formatCurrency } from '@/lib/utils/format';

interface WhatsAppOrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface WhatsAppOrderData {
  invoiceNumber: string;
  customerName: string;
  items: WhatsAppOrderItem[];
  subtotal: number;
  discountAmount: number;
  deliveryCharge: number;
  totalAmount: number;
  fulfillmentType: 'DELIVERY' | 'PICKUP';
  address?: { address: string; city: string; pincode: string } | null;
}

/**
 * Build WhatsApp message text for order confirmation
 */
export function buildWhatsAppMessage(order: WhatsAppOrderData): string {
  const storeName = APP_CONFIG.STORE_NAME;
  const lines: string[] = [];

  lines.push(`🎆 *${storeName}*`);
  lines.push(`📋 *Order Confirmation*`);
  lines.push(`━━━━━━━━━━━━━━━━`);
  lines.push(`*Invoice:* ${order.invoiceNumber}`);
  lines.push(`*Customer:* ${order.customerName}`);
  lines.push(``);
  lines.push(`*Items:*`);

  for (const item of order.items) {
    lines.push(`▸ ${item.name} × ${item.quantity} — ${formatCurrency(item.price * item.quantity)}`);
  }

  lines.push(``);
  lines.push(`━━━━━━━━━━━━━━━━`);
  lines.push(`*Subtotal:* ${formatCurrency(order.subtotal)}`);

  if (order.discountAmount > 0) {
    lines.push(`*Discount:* -${formatCurrency(order.discountAmount)}`);
  }

  if (order.fulfillmentType === 'DELIVERY') {
    lines.push(`*Delivery:* ${order.deliveryCharge > 0 ? formatCurrency(order.deliveryCharge) : 'FREE'}`);
  }

  lines.push(`*Total:* ${formatCurrency(order.totalAmount)}`);
  lines.push(``);
  lines.push(`*Fulfillment:* ${order.fulfillmentType === 'DELIVERY' ? '🚚 Home Delivery' : '🏪 Shop Pickup'}`);

  if (order.fulfillmentType === 'DELIVERY' && order.address) {
    lines.push(`*Address:* ${order.address.address}, ${order.address.city} - ${order.address.pincode}`);
  }

  lines.push(``);
  lines.push(`Please confirm this order. Thank you! 🙏`);

  return lines.join('\n');
}

/**
 * Generate WhatsApp click-to-chat URL
 */
export function generateWhatsAppUrl(order: WhatsAppOrderData): string {
  const message = buildWhatsAppMessage(order);
  const phone = APP_CONFIG.WHATSAPP_NUMBER;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encodedMessage}`;
}
