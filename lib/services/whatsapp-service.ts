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
  carriageDetails?: string | null;
  lrNumber?: string | null;
  lrCopyUrl?: string | null;
  packageCount?: number | null;
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
  lines.push(`📦 *Carriage & Logistics Details:*`);
  if (order.carriageDetails) {
    lines.push(`• *Carriage / Transport:* ${order.carriageDetails}`);
  }
  lines.push(`• *Carrier / Partner:* ${order.deliveryPartner?.name || 'Sivakasi Parcel Transport'}`);
  if (order.deliveryPartner?.mobileNumber) {
    lines.push(`• *Partner Contact:* ${order.deliveryPartner.mobileNumber}`);
  }
  if (order.deliveryPartner?.vehicleNumber) {
    lines.push(`• *Vehicle Number:* ${order.deliveryPartner.vehicleNumber}`);
  }
  if (order.lrNumber) {
    lines.push(`• *Lorry Receipt (LR) No:* ${order.lrNumber}`);
  }
  if (order.lrCopyUrl) {
    lines.push(`• *LR Copy Link:* ${order.lrCopyUrl}`);
  }

  const itemsCount = (order.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0);
  lines.push(`• *Total Items:* ${itemsCount} items (${(order.items || []).length} products)`);
  lines.push(`• *Boxes / Cases:* ${order.packageCount || 1} Box(es) / Case(s)`);
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
  lines.push(`• Total: ${itemsCount} items | *${order.packageCount || 1} Box(es) / Case(s)* | Amount: *${formatCurrency(order.totalAmount || 0)}*`);
  if (order.carriageDetails) {
    lines.push(`• *Carriage / Transport:* ${order.carriageDetails}`);
  }
  if (order.lrNumber) {
    lines.push(`• *Lorry Receipt (LR) No:* ${order.lrNumber}`);
  }
  if (order.lrCopyUrl) {
    lines.push(`• *LR Copy Link:* ${order.lrCopyUrl}`);
  }

  if (order.address) {
    const formattedAddr = formatOrderAddress(order.address);
    if (formattedAddr) {
      lines.push(`• *Delivery Location:*`);
      lines.push(`  ${formattedAddr}`);
    }
  }

  lines.push(``);
  lines.push(`🔔 *Please Note:* Kindly carry a copy/photo of the LR (Lorry Receipt) when collecting crackers from the transport office.`);

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
  lines.push(`✅ *ORDER DELIVERED / COLLECTED SUCCESSFULLY!*`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`Dear *${order.customerName || 'Valued Customer'}*,`);
  lines.push(`Your fireworks package for order *${order.invoiceNumber}* has been delivered / collected! 🎉`);
  lines.push(``);
  lines.push(`📦 *Summary:* ${(order.items || []).length} products | *${formatCurrency(order.totalAmount || 0)}*`);
  if (order.lrNumber) {
    lines.push(`• *LR Receipt Ref:* ${order.lrNumber}`);
  }
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
/**
 * Centralized Settings DB Keys mapping for configurable WhatsApp templates.
 */
export const WHATSAPP_SETTINGS_KEYS: Record<WhatsAppProcessType, string> = {
  ORDER_CONFIRMED: 'WHATSAPP_TEMPLATE_ORDER_CONFIRMED',
  ORDER_ASSIGNED: 'WHATSAPP_TEMPLATE_ORDER_ASSIGNED',
  ORDER_OUT_FOR_DELIVERY: 'WHATSAPP_TEMPLATE_ORDER_OUT_FOR_DELIVERY',
  ORDER_DELIVERED: 'WHATSAPP_TEMPLATE_ORDER_DELIVERED',
  ORDER_RECEIVED: 'WHATSAPP_TEMPLATE_ORDER_RECEIVED',
};

/**
 * Standard default template strings with placeholder tags.
 */
export const DEFAULT_WHATSAPP_TEMPLATES: Record<WhatsAppProcessType, string> = {
  ORDER_CONFIRMED: `✨ *{storeName}* ✨
🎉 *ORDER CONFIRMED & QUOTATION*
━━━━━━━━━━━━━━━━━━━━━
Dear *{customerName}*,
Thank you for choosing {storeName}, Sivakasi! Your order has been reviewed and confirmed.

📄 *Invoice No:* {invoiceNumber}
📦 *Fulfillment:* {fulfillmentType}

🛍️ *Ordered Products & Quotation:*
{productsList}

━━━━━━━━━━━━━━━━━━━━━
💰 *Payment & Total Breakdown:*
• Subtotal: {subtotal}
• Delivery Charge: {deliveryCharge}
*Grand Total: {totalAmount}*
━━━━━━━━━━━━━━━━━━━━━

📍 *Delivery Address:*
{deliveryAddress}

🔗 *View Order / Live Tracking:*
{trackingUrl}

📞 *Questions? Call/WhatsApp:* {storePhone}
Wishing you a safe and joyful festive celebration! 🎆`,

  ORDER_ASSIGNED: `✨ *{storeName}* ✨
🚚 *ORDER DISPATCHED & DELIVERY ASSIGNED*
━━━━━━━━━━━━━━━━━━━━━
Dear *{customerName}*,
Great news! Your fireworks order *{invoiceNumber}* has been packed and handed over to our delivery logistics partner.

📦 *Logistics Partner Details:*
• *Carrier / Partner:* {deliveryPartnerName}
• *Partner Contact:* {deliveryPartnerMobile}
• *Vehicle Number:* {deliveryPartnerVehicle}
• *Total Items:* {itemsCount} items ({productsCount} products)
• *Order Amount:* {totalAmount}
• *Destination City:* {deliveryCity}

🔗 *Track Your Delivery:*
{trackingUrl}

The delivery team will contact you prior to arrival.
Thank you for shopping with {storeName}! 🎆`,

  ORDER_OUT_FOR_DELIVERY: `✨ *{storeName}* ✨
🛵 *OUT FOR DELIVERY TODAY!*
━━━━━━━━━━━━━━━━━━━━━
Dear *{customerName}*,
Your fireworks order *{invoiceNumber}* is *OUT FOR DELIVERY* today!

📦 *Consignment Summary:*
• Total: {itemsCount} items | Amount: *{totalAmount}*
• *Delivery Location:*
  {deliveryAddress}

🔔 *Please Note:* Kindly ensure an adult is available at the delivery address with a valid mobile phone to receive the package.

🔗 *Live Status:*
{trackingUrl}

📞 *Delivery Helpline:* {storePhone}
Get ready for dazzling festive moments! 🎆✨`,

  ORDER_DELIVERED: `✨ *{storeName}* ✨
✅ *ORDER DELIVERED SUCCESSFULLY!*
━━━━━━━━━━━━━━━━━━━━━
Dear *{customerName}*,
Your fireworks package for order *{invoiceNumber}* has been delivered! 🎉

📦 *Summary:* {productsCount} products | *{totalAmount}*

🎆 May this festive season bring immense brightness, peace, and prosperity to you and your loved ones!

⚠️ *Safety Reminder:*
• Always ignite crackers under adult supervision in open outdoor spaces.
• Keep a bucket of water and sand nearby for emergency safety.

⭐ We would love to hear your feedback!
📞 *Customer Support:* {storePhone}
Thank you for choosing {storeName}! 🎇`,

  ORDER_RECEIVED: `✨ *{storeName}* ✨
📝 *ORDER RECEIVED*
━━━━━━━━━━━━━━━━━━━━━
Dear *{customerName}*,
We have received your order *{invoiceNumber}* totaling *{totalAmount}*.
Our team is reviewing the order and checking warehouse stock. We will send you the confirmed quotation shortly.

🔗 *Track Status:* {trackingUrl}
📞 *Helpline:* {storePhone}`,
};

/**
 * List of available dynamic tags for template editing UI.
 */
export const WHATSAPP_TEMPLATE_TAGS: Array<{ tag: string; label: string; desc: string }> = [
  { tag: '{customerName}', label: 'Customer Name', desc: 'Customer name snapshot' },
  { tag: '{invoiceNumber}', label: 'Invoice No', desc: 'Order invoice identifier' },
  { tag: '{totalAmount}', label: 'Grand Total', desc: 'Formatted grand total amount' },
  { tag: '{productsList}', label: 'Product List', desc: 'Numbered list with quantities & prices' },
  { tag: '{subtotal}', label: 'Subtotal', desc: 'Subtotal before discounts & shipping' },
  { tag: '{discountAmount}', label: 'Discount', desc: 'Festive discount amount' },
  { tag: '{deliveryCharge}', label: 'Delivery Fee', desc: 'Delivery charge or FREE' },
  { tag: '{fulfillmentType}', label: 'Fulfillment', desc: 'Doorstep Delivery or Sivakasi Counter Pickup' },
  { tag: '{deliveryAddress}', label: 'Delivery Address', desc: 'Full delivery address with city & PIN' },
  { tag: '{deliveryCity}', label: 'City', desc: 'Destination city name' },
  { tag: '{deliveryPartnerName}', label: 'Partner Name', desc: 'Assigned logistics partner name' },
  { tag: '{deliveryPartnerMobile}', label: 'Partner Mobile', desc: 'Driver/partner contact number' },
  { tag: '{deliveryPartnerVehicle}', label: 'Vehicle No', desc: 'Transport vehicle registration' },
  { tag: '{trackingUrl}', label: 'Tracking URL', desc: 'Direct order view & tracking link' },
  { tag: '{storeName}', label: 'Store Name', desc: 'Rajalakshmi Fireworks store name' },
  { tag: '{storePhone}', label: 'Store Phone', desc: 'Customer care helpline phone' },
  { tag: '{whatsappNumber}', label: 'WhatsApp Mobile', desc: 'Official WhatsApp order number' },
  { tag: '{itemsCount}', label: 'Items Count', desc: 'Total aggregate items count' },
  { tag: '{productsCount}', label: 'Products Count', desc: 'Number of distinct products' },
];

/**
 * Interpolates template string placeholders with actual order and store data.
 */
export function interpolateWhatsAppTemplate(
  template: string,
  order: WhatsAppOrderData,
  storeConfig?: { storeName?: string; storePhone?: string; whatsappNumber?: string }
): string {
  if (!template) return '';

  const storeName = storeConfig?.storeName || APP_CONFIG.STORE_NAME || 'Rajalakshmi Fireworks';
  const storePhone = storeConfig?.storePhone || APP_CONFIG.STORE_PHONE || '+91 9876543210';
  const whatsappNumber = storeConfig?.whatsappNumber || APP_CONFIG.WHATSAPP_NUMBER || '919876543210';

  const customerName = order.customerName || 'Valued Customer';
  const customerMobile = order.customerMobile || '';
  const invoiceNumber = order.invoiceNumber || 'N/A';
  const fulfillmentType =
    order.fulfillmentType === 'DELIVERY' ? 'Doorstep Delivery' : 'Sivakasi Counter Pickup';

  const items = order.items || [];
  let productsList = '';
  if (items.length > 0) {
    productsList = items
      .map((item, idx) => {
        const qty = item.quantity || 1;
        const price = item.price || 0;
        const lineTotal = price * qty;
        return `${idx + 1}. *${item.name}*\n    Qty: ${qty} × ${formatCurrency(price)} = *${formatCurrency(lineTotal)}*`;
      })
      .join('\n');
  } else {
    productsList = '• No items listed';
  }

  const itemsCount = String(items.reduce((acc, i) => acc + (i.quantity || 1), 0));
  const productsCount = String(items.length);
  const subtotal = formatCurrency(order.subtotal || 0);
  const discountAmount = formatCurrency(order.discountAmount || 0);
  const deliveryCharge =
    (order.deliveryCharge || 0) > 0 ? formatCurrency(order.deliveryCharge) : 'FREE';
  const totalAmount = formatCurrency(order.totalAmount || 0);
  const deliveryAddress =
    formatOrderAddress(order.address) ||
    (order.fulfillmentType === 'DELIVERY' ? 'Address on file' : 'Sivakasi Counter Pickup');
  const deliveryCity = order.address?.city || '';
  const deliveryPartnerName = order.deliveryPartner?.name || 'Express Logistics Partner';
  const deliveryPartnerMobile = order.deliveryPartner?.mobileNumber || 'N/A';
  const deliveryPartnerVehicle = order.deliveryPartner?.vehicleNumber || 'N/A';
  const trackingUrl = order.trackingUrl || '';

  const replacements: Record<string, string> = {
    '{storeName}': storeName,
    '{storePhone}': storePhone,
    '{whatsappNumber}': whatsappNumber,
    '{customerName}': customerName,
    '{customerMobile}': customerMobile,
    '{invoiceNumber}': invoiceNumber,
    '{fulfillmentType}': fulfillmentType,
    '{productsList}': productsList,
    '{items}': productsList,
    '{itemsCount}': itemsCount,
    '{productsCount}': productsCount,
    '{subtotal}': subtotal,
    '{discountAmount}': discountAmount,
    '{deliveryCharge}': deliveryCharge,
    '{totalAmount}': totalAmount,
    '{deliveryAddress}': deliveryAddress,
    '{deliveryCity}': deliveryCity,
    '{deliveryPartnerName}': deliveryPartnerName,
    '{deliveryPartnerMobile}': deliveryPartnerMobile,
    '{deliveryPartnerVehicle}': deliveryPartnerVehicle,
    '{trackingUrl}': trackingUrl,
  };

  let result = template;
  for (const [key, val] of Object.entries(replacements)) {
    result = result.split(key).join(val);
  }
  return result;
}

/**
 * Build message by process type (supports custom template override)
 */
export function buildProcessWhatsAppMessage(
  processType: WhatsAppProcessType,
  order: WhatsAppOrderData,
  customTemplate?: string | null,
  storeConfig?: { storeName?: string; storePhone?: string; whatsappNumber?: string }
): string {
  if (customTemplate && customTemplate.trim().length > 0) {
    return interpolateWhatsAppTemplate(customTemplate, order, storeConfig);
  }

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
  processType: WhatsAppProcessType,
  customTemplate?: string | null,
  storeConfig?: { storeName?: string; storePhone?: string; whatsappNumber?: string }
): string {
  const message = buildProcessWhatsAppMessage(processType, order, customTemplate, storeConfig);
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
 * Supports overriding template strings from Store Settings
 */
export function getOrderWhatsAppTemplates(
  order: WhatsAppOrderData,
  customerMobile?: string | null,
  customTemplates?: Partial<Record<WhatsAppProcessType, string>>,
  storeConfig?: { storeName?: string; storePhone?: string; whatsappNumber?: string }
): WhatsAppTemplateOption[] {
  const phone = customerMobile || order.customerMobile || '';

  const getMsg = (type: WhatsAppProcessType) => {
    const custom = customTemplates?.[type];
    return buildProcessWhatsAppMessage(type, order, custom, storeConfig);
  };

  return [
    {
      type: 'ORDER_CONFIRMED',
      label: 'Order Confirmed & Quotation',
      badge: 'Quotation with Products',
      description: 'Send itemized product list, prices, totals, and confirmation link.',
      messageText: getMsg('ORDER_CONFIRMED'),
      shareUrl: generateWhatsAppProcessShareUrl(phone, order, 'ORDER_CONFIRMED', customTemplates?.ORDER_CONFIRMED, storeConfig),
    },
    {
      type: 'ORDER_ASSIGNED',
      label: 'Delivery Assigned',
      badge: 'Dispatched & Courier',
      description: 'Send logistics partner name, contact, vehicle, and dispatch details.',
      messageText: getMsg('ORDER_ASSIGNED'),
      shareUrl: generateWhatsAppProcessShareUrl(phone, order, 'ORDER_ASSIGNED', customTemplates?.ORDER_ASSIGNED, storeConfig),
    },
    {
      type: 'ORDER_OUT_FOR_DELIVERY',
      label: 'Out for Delivery',
      badge: 'Out Today',
      description: 'Notify customer that the delivery team is on the way today.',
      messageText: getMsg('ORDER_OUT_FOR_DELIVERY'),
      shareUrl: generateWhatsAppProcessShareUrl(phone, order, 'ORDER_OUT_FOR_DELIVERY', customTemplates?.ORDER_OUT_FOR_DELIVERY, storeConfig),
    },
    {
      type: 'ORDER_DELIVERED',
      label: 'Delivered Successfully',
      badge: 'Completed & Wishes',
      description: 'Confirm successful delivery with safety tips and festive wishes.',
      messageText: getMsg('ORDER_DELIVERED'),
      shareUrl: generateWhatsAppProcessShareUrl(phone, order, 'ORDER_DELIVERED', customTemplates?.ORDER_DELIVERED, storeConfig),
    },
    {
      type: 'ORDER_RECEIVED',
      label: 'Order Received',
      badge: 'Initial Acknowledgement',
      description: 'Initial order acknowledgement before admin verification.',
      messageText: getMsg('ORDER_RECEIVED'),
      shareUrl: generateWhatsAppProcessShareUrl(phone, order, 'ORDER_RECEIVED', customTemplates?.ORDER_RECEIVED, storeConfig),
    },
  ];
}
