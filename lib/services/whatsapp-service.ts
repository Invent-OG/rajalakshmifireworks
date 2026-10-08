import { APP_CONFIG } from '@/lib/constants/config';
import { formatCurrency } from '@/lib/utils/format';

export interface WhatsAppOrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface WhatsAppDeliveryPartnerInfo {
  name: string;
  mobileNumber?: string | null;
  vehicleNumber?: string | null;
}

export interface WhatsAppOrderData {
  invoiceNumber: string;
  customerName: string;
  customerMobile?: string | null;
  items: WhatsAppOrderItem[];
  subtotal: number;
  discountAmount: number;
  deliveryCharge: number;
  totalAmount: number;
  fulfillmentType: 'DELIVERY' | 'PICKUP';
  address?: {
    address?: string;
    area?: string;
    deliveryArea?: string;
    city?: string;
    state?: string;
    pincode?: string;
  } | null;
  deliveryPartner?: WhatsAppDeliveryPartnerInfo | null;
  trackingUrl?: string;
}

export type WhatsAppProcessType =
  | 'ORDER_CONFIRMED'
  | 'ORDER_ASSIGNED'
  | 'ORDER_OUT_FOR_DELIVERY'
  | 'ORDER_DELIVERED'
  | 'ORDER_RECEIVED';

/**
 * Clean phone number to WhatsApp international format (e.g., 919876543210)
 */
export function formatWhatsAppRecipientPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';
  return digits.length === 10 ? `91${digits}` : digits;
}

/**
 * Generic WhatsApp Click-to-Chat URL builder
 */
export function buildWhatsAppShareUrl(recipientPhone: string, messageText: string): string {
  const formattedPhone = formatWhatsAppRecipientPhone(recipientPhone);
  const encoded = encodeURIComponent(messageText);
  return formattedPhone ? `https://wa.me/${formattedPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

/**
 * Format address snapshot into readable string
 */
export function formatOrderAddress(address?: WhatsAppOrderData['address'] | any): string {
  if (!address) return '';
  const street = address.deliveryAddress || address.address || '';
  const area = address.deliveryArea || address.area || '';
  const city = address.deliveryCityName || address.city || '';
  const state = address.deliveryStateName || address.state || '';
  const pin = address.pincode ? `PIN: ${address.pincode}` : '';
  return [street, area, city, state, pin].filter(Boolean).join(', ');
}

/**
 * 1. Template: Order Confirmed & Quotation (with products list)
 */
export function buildOrderConfirmationMessage(order: WhatsAppOrderData): string {
  const storeName = APP_CONFIG.STORE_NAME || 'Rajalakshmi Fireworks';
  const storePhone = APP_CONFIG.STORE_PHONE || '+91 9876543210';
  const lines: string[] = [];

  lines.push(`✨ *${storeName.toUpperCase()}* ✨`);
  lines.push(`🎉 *ORDER CONFIRMED & QUOTATION*`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`Dear *${order.customerName || 'Valued Customer'}*,`);
  lines.push(`Thank you for choosing Rajalakshmi Fireworks, Sivakasi! Your order has been reviewed and confirmed.`);
  lines.push(``);
  lines.push(`📄 *Invoice No:* ${order.invoiceNumber || 'N/A'}`);
  lines.push(`📦 *Fulfillment:* ${order.fulfillmentType === 'DELIVERY' ? 'Doorstep Delivery' : 'Sivakasi Counter Pickup'}`);
  lines.push(``);
  lines.push(`🛍️ *Ordered Products & Quotation:*`);

  const items = order.items || [];
  if (items.length > 0) {
    items.forEach((item, idx) => {
      const qty = item.quantity || 1;
      const price = item.price || 0;
      const lineTotal = price * qty;
      lines.push(`${idx + 1}. *${item.name}*`);
      lines.push(`    Qty: ${qty} × ${formatCurrency(price)} = *${formatCurrency(lineTotal)}*`);
    });
  } else {
    lines.push(`• No items listed`);
  }

  lines.push(``);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`💰 *Payment & Total Breakdown:*`);
  lines.push(`• Subtotal: ${formatCurrency(order.subtotal || 0)}`);
  if ((order.discountAmount || 0) > 0) {
    lines.push(`• Festive Discount: -${formatCurrency(order.discountAmount)}`);
  }
  if (order.fulfillmentType === 'DELIVERY') {
    lines.push(`• Delivery Charge: ${(order.deliveryCharge || 0) > 0 ? formatCurrency(order.deliveryCharge) : 'FREE'}`);
  }
  lines.push(`*Grand Total: ${formatCurrency(order.totalAmount || 0)}*`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);

  if (order.fulfillmentType === 'DELIVERY' && order.address) {
    const formattedAddr = formatOrderAddress(order.address);
    if (formattedAddr) {
      lines.push(``);
      lines.push(`📍 *Delivery Address:*`);
      lines.push(formattedAddr);
    }
  }

  if (order.trackingUrl) {
    lines.push(``);
    lines.push(`🔗 *View Order / Live Tracking:*`);
    lines.push(order.trackingUrl);
  }

  lines.push(``);
  lines.push(`📞 *Questions? Call/WhatsApp:* ${storePhone}`);
  lines.push(`Wishing you a safe and joyful festive celebration! 🎆`);

  return lines.join('\n');
}

/**
 * 2. Template: Delivery Partner Assigned / Dispatched
 */
export function buildOrderAssignedMessage(order: WhatsAppOrderData): string {
  const storeName = APP_CONFIG.STORE_NAME || 'Rajalakshmi Fireworks';
  const lines: string[] = [];

  lines.push(`✨ *${storeName.toUpperCase()}* ✨`);
  lines.push(`🚚 *ORDER DISPATCHED & DELIVERY ASSIGNED*`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`Dear *${order.customerName || 'Valued Customer'}*,`);
  lines.push(`Great news! Your fireworks order *${order.invoiceNumber}* has been packed and handed over to our delivery logistics partner.`);
  lines.push(``);
  lines.push(`📦 *Logistics Partner Details:*`);
  lines.push(`• *Carrier / Partner:* ${order.deliveryPartner?.name || 'Express Logistics Partner'}`);
  if (order.deliveryPartner?.mobileNumber) {
    lines.push(`• *Partner Contact:* ${order.deliveryPartner.mobileNumber}`);
  }
  if (order.deliveryPartner?.vehicleNumber) {
    lines.push(`• *Vehicle Number:* ${order.deliveryPartner.vehicleNumber}`);
  }

  const itemsCount = (order.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0);
  lines.push(`• *Total Items:* ${itemsCount} items (${(order.items || []).length} products)`);
  lines.push(`• *Order Amount:* ${formatCurrency(order.totalAmount || 0)}`);

  if (order.address?.city) {
    lines.push(`• *Destination City:* ${order.address.city} ${order.address.pincode ? `(${order.address.pincode})` : ''}`);
  }

  if (order.trackingUrl) {
    lines.push(``);
    lines.push(`🔗 *Track Your Delivery:*`);
    lines.push(order.trackingUrl);
  }

  lines.push(``);
  lines.push(`The delivery team will contact you prior to arrival.`);
  lines.push(`Thank you for shopping with ${storeName}! 🎆`);

  return lines.join('\n');
}

/**
 * 3. Template: Out for Delivery
 */
export function buildOrderOutForDeliveryMessage(order: WhatsAppOrderData): string {
  const storeName = APP_CONFIG.STORE_NAME || 'Rajalakshmi Fireworks';
  const storePhone = APP_CONFIG.STORE_PHONE || '+91 9876543210';
  const lines: string[] = [];

  lines.push(`✨ *${storeName.toUpperCase()}* ✨`);
  lines.push(`🛵 *OUT FOR DELIVERY TODAY!*`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`Dear *${order.customerName || 'Valued Customer'}*,`);
  lines.push(`Your fireworks order *${order.invoiceNumber}* is *OUT FOR DELIVERY* today!`);
  lines.push(``);
  lines.push(`📦 *Consignment Summary:*`);
  const itemsCount = (order.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0);
  lines.push(`• Total: ${itemsCount} items | Amount: *${formatCurrency(order.totalAmount || 0)}*`);

  if (order.address) {
    const formattedAddr = formatOrderAddress(order.address);
    if (formattedAddr) {
      lines.push(`• *Delivery Location:*`);
      lines.push(`  ${formattedAddr}`);
    }
  }

  lines.push(``);
  lines.push(`🔔 *Please Note:* Kindly ensure an adult is available at the delivery address with a valid mobile phone to receive the package.`);

  if (order.trackingUrl) {
    lines.push(``);
    lines.push(`🔗 *Live Status:*`);
    lines.push(order.trackingUrl);
  }

  lines.push(``);
  lines.push(`📞 *Delivery Helpline:* ${storePhone}`);
  lines.push(`Get ready for dazzling festive moments! 🎆✨`);

  return lines.join('\n');
}

/**
 * 4. Template: Delivered & Celebration Wishes
 */
export function buildOrderDeliveredMessage(order: WhatsAppOrderData): string {
  const storeName = APP_CONFIG.STORE_NAME || 'Rajalakshmi Fireworks';
  const storePhone = APP_CONFIG.STORE_PHONE || '+91 9876543210';
  const lines: string[] = [];

  lines.push(`✨ *${storeName.toUpperCase()}* ✨`);
  lines.push(`✅ *ORDER DELIVERED SUCCESSFULLY!*`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`Dear *${order.customerName || 'Valued Customer'}*,`);
  lines.push(`Your fireworks package for order *${order.invoiceNumber}* has been delivered! 🎉`);
  lines.push(``);
  lines.push(`📦 *Summary:* ${(order.items || []).length} products | *${formatCurrency(order.totalAmount || 0)}*`);
  lines.push(``);
  lines.push(`🎆 May this festive season bring immense brightness, peace, and prosperity to you and your loved ones!`);
  lines.push(``);
  lines.push(`⚠️ *Safety Reminder:*`);
  lines.push(`• Always ignite crackers under adult supervision in open outdoor spaces.`);
  lines.push(`• Keep a bucket of water and sand nearby for emergency safety.`);
  lines.push(``);
  lines.push(`⭐ We would love to hear your feedback!`);
  lines.push(`📞 *Customer Support:* ${storePhone}`);
  lines.push(`Thank you for choosing ${storeName}! 🎇`);

  return lines.join('\n');
}

/**
 * 5. Template: Order Received / Placed
 */
export function buildOrderReceivedMessage(order: WhatsAppOrderData): string {
  const storeName = APP_CONFIG.STORE_NAME || 'Rajalakshmi Fireworks';
  const storePhone = APP_CONFIG.STORE_PHONE || '+91 9876543210';
  const lines: string[] = [];

  lines.push(`✨ *${storeName.toUpperCase()}* ✨`);
  lines.push(`📝 *ORDER RECEIVED*`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`Dear *${order.customerName || 'Valued Customer'}*,`);
  lines.push(`We have received your order *${order.invoiceNumber}* totaling *${formatCurrency(order.totalAmount || 0)}*.`);
  lines.push(`Our team is reviewing the order and checking warehouse stock. We will send you the confirmed quotation shortly.`);
  lines.push(``);
  if (order.trackingUrl) {
    lines.push(`🔗 *Track Status:* ${order.trackingUrl}`);
  }
  lines.push(`📞 *Helpline:* ${storePhone}`);

  return lines.join('\n');
}

/**
 * Build message by process type
 */
export function buildProcessWhatsAppMessage(
  processType: WhatsAppProcessType,
  order: WhatsAppOrderData
): string {
  switch (processType) {
    case 'ORDER_CONFIRMED':
      return buildOrderConfirmationMessage(order);
    case 'ORDER_ASSIGNED':
      return buildOrderAssignedMessage(order);
    case 'ORDER_OUT_FOR_DELIVERY':
      return buildOrderOutForDeliveryMessage(order);
    case 'ORDER_DELIVERED':
      return buildOrderDeliveredMessage(order);
    case 'ORDER_RECEIVED':
      return buildOrderReceivedMessage(order);
    default:
      return buildOrderConfirmationMessage(order);
  }
}

/**
 * Legacy support for previous quotation function
 */
export function buildWhatsAppMessage(order: WhatsAppOrderData): string {
  return buildOrderConfirmationMessage(order);
}

/**
 * Generate WhatsApp click-to-chat URL for customer order confirmation (to store phone)
 */
export function generateWhatsAppUrl(order: WhatsAppOrderData): string {
  const message = buildOrderConfirmationMessage(order);
  const phone = APP_CONFIG.WHATSAPP_NUMBER;
  return buildWhatsAppShareUrl(phone, message);
}


export function generateCustomerWhatsAppQuotationUrl(
  customerMobile: string | null | undefined,
  order: WhatsAppOrderData
): string {
  const message = buildOrderConfirmationMessage(order);
  return buildWhatsAppShareUrl(customerMobile || '', message);
}

export function generateWhatsAppProcessShareUrl(
  customerMobile: string | null | undefined,
  order: WhatsAppOrderData,
  processType: WhatsAppProcessType
): string {
  const message = buildProcessWhatsAppMessage(processType, order);
  return buildWhatsAppShareUrl(customerMobile || '', message);
}

export interface WhatsAppTemplateOption {
  type: WhatsAppProcessType;
  label: string;
  badge: string;
  description: string;
  messageText: string;
  shareUrl: string;
}

/**
 * Get all available process templates with pre-rendered messages and wa.me links
 */
export function getOrderWhatsAppTemplates(
  order: WhatsAppOrderData,
  customerMobile?: string | null
): WhatsAppTemplateOption[] {
  const phone = customerMobile || order.customerMobile || '';
  
  return [
    {
      type: 'ORDER_CONFIRMED',
      label: 'Order Confirmed & Quotation',
      badge: 'Quotation with Products',
      description: 'Send itemized product list, prices, totals, and confirmation link.',
      messageText: buildOrderConfirmationMessage(order),
      shareUrl: generateWhatsAppProcessShareUrl(phone, order, 'ORDER_CONFIRMED'),
    },
    {
      type: 'ORDER_ASSIGNED',
      label: 'Delivery Assigned',
      badge: 'Dispatched & Courier',
      description: 'Send logistics partner name, contact, vehicle, and dispatch details.',
      messageText: buildOrderAssignedMessage(order),
      shareUrl: generateWhatsAppProcessShareUrl(phone, order, 'ORDER_ASSIGNED'),
    },
    {
      type: 'ORDER_OUT_FOR_DELIVERY',
      label: 'Out for Delivery',
      badge: 'Out Today',
      description: 'Notify customer that the delivery team is on the way today.',
      messageText: buildOrderOutForDeliveryMessage(order),
      shareUrl: generateWhatsAppProcessShareUrl(phone, order, 'ORDER_OUT_FOR_DELIVERY'),
    },
    {
      type: 'ORDER_DELIVERED',
      label: 'Delivered Successfully',
      badge: 'Completed & Wishes',
      description: 'Confirm successful delivery with safety tips and festive wishes.',
      messageText: buildOrderDeliveredMessage(order),
      shareUrl: generateWhatsAppProcessShareUrl(phone, order, 'ORDER_DELIVERED'),
    },
    {
      type: 'ORDER_RECEIVED',
      label: 'Order Received',
      badge: 'Initial Acknowledgement',
      description: 'Initial order acknowledgement before admin verification.',
      messageText: buildOrderReceivedMessage(order),
      shareUrl: generateWhatsAppProcessShareUrl(phone, order, 'ORDER_RECEIVED'),
    },
  ];
}
