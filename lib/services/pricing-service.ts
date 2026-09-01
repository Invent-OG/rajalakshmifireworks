import { toNumber } from '@/lib/utils/format';

interface PriceCalculation {
  subtotal: number;
  totalDiscount: number;
  deliveryCharge: number;
  grandTotal: number;
}

interface CartItemForPricing {
  mrp: number | string;
  sellingPrice: number | string;
  quantity: number;
}

/**
 * Calculate order totals — ALWAYS run server-side, never trust client values
 */
export function calculateOrderTotals(
  items: CartItemForPricing[],
  deliveryCharge: number = 0
): PriceCalculation {
  let subtotal = 0;
  let totalDiscount = 0;

  for (const item of items) {
    const mrp = toNumber(item.mrp);
    const price = toNumber(item.sellingPrice);
    const qty = item.quantity;

    subtotal += price * qty;
    totalDiscount += (mrp - price) * qty;
  }

  const grandTotal = subtotal + deliveryCharge;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    deliveryCharge: Math.round(deliveryCharge * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
  };
}

/**
 * Calculate line total for a single order item
 */
export function calculateLineTotal(sellingPrice: number | string, quantity: number): number {
  return Math.round(toNumber(sellingPrice) * quantity * 100) / 100;
}

/**
 * Apply bulk price update to a product
 */
export function applyBulkPriceUpdate(
  currentPrice: number,
  updateType: 'percentage_increase' | 'percentage_decrease' | 'fixed_amount' | 'direct_price',
  value: number,
  mrp: number
): number {
  let newPrice: number;

  switch (updateType) {
    case 'percentage_increase':
      newPrice = currentPrice * (1 + value / 100);
      break;
    case 'percentage_decrease':
      newPrice = currentPrice * (1 - value / 100);
      break;
    case 'fixed_amount':
      newPrice = currentPrice + value;
      break;
    case 'direct_price':
      newPrice = value;
      break;
  }

  // Ensure price doesn't exceed MRP and is not negative
  newPrice = Math.max(0, Math.min(newPrice, mrp));
  return Math.round(newPrice * 100) / 100;
}

/**
 * Determine delivery charge based on settings
 */
export function getDeliveryCharge(
  subtotal: number,
  deliveryChargeRate: number,
  freeDeliveryAbove: number,
  fulfillmentType: 'DELIVERY' | 'PICKUP'
): number {
  if (fulfillmentType === 'PICKUP') return 0;
  if (subtotal >= freeDeliveryAbove) return 0;
  return deliveryChargeRate;
}
