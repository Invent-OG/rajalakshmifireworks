import { describe, it, expect } from 'vitest';
import {
  calculateOrderTotals,
  calculateLineTotal,
  applyBulkPriceUpdate,
  getDeliveryCharge,
} from '@/lib/services/pricing-service';
import { calculateDiscountPercent, calculateSavings } from '@/lib/utils/format';

describe('Pricing Service & Calculation Engine', () => {
  it('calculates order totals accurately without trusting client inputs', () => {
    const items = [
      { mrp: 100, sellingPrice: 80, quantity: 2 },
      { mrp: 500, sellingPrice: 400, quantity: 1 },
    ];

    const result = calculateOrderTotals(items, 50);

    // Subtotal: (80*2) + (400*1) = 160 + 400 = 560
    expect(result.subtotal).toBe(560);
    // Discount: (20*2) + (100*1) = 40 + 100 = 140
    expect(result.totalDiscount).toBe(140);
    // Delivery charge: 50
    expect(result.deliveryCharge).toBe(50);
    // Grand total: 560 + 50 = 610
    expect(result.grandTotal).toBe(610);
  });

  it('calculates line total for individual products', () => {
    expect(calculateLineTotal('299.50', 3)).toBe(898.5);
    expect(calculateLineTotal(50, 4)).toBe(200);
  });

  it('calculates discount percentage correctly', () => {
    expect(calculateDiscountPercent(1000, 799)).toBe(20);
    expect(calculateDiscountPercent(500, 250)).toBe(50);
    expect(calculateDiscountPercent(100, 100)).toBe(0);
    expect(calculateDiscountPercent(0, 100)).toBe(0);
  });

  it('calculates savings correctly', () => {
    expect(calculateSavings(1000, 799)).toBe(201);
    expect(calculateSavings(200, 200)).toBe(0);
  });

  it('determines delivery charges with threshold and pickup checks', () => {
    // Pickup is always free
    expect(getDeliveryCharge(100, 50, 2000, 'PICKUP')).toBe(0);

    // Delivery under threshold pays flat delivery charge
    expect(getDeliveryCharge(1500, 50, 2000, 'DELIVERY')).toBe(50);

    // Delivery above threshold gets free delivery
    expect(getDeliveryCharge(2500, 50, 2000, 'DELIVERY')).toBe(0);
  });

  describe('Bulk Price Updates', () => {
    it('applies percentage decrease without dropping below 0', () => {
      const newPrice = applyBulkPriceUpdate(100, 'percentage_decrease', 20, 150);
      expect(newPrice).toBe(80);
    });

    it('applies percentage increase capped at MRP', () => {
      // 100 + 50% = 150, but MRP is 120 -> capped at 120
      const newPrice = applyBulkPriceUpdate(100, 'percentage_increase', 50, 120);
      expect(newPrice).toBe(120);
    });

    it('applies fixed amount adjustment', () => {
      const newPrice = applyBulkPriceUpdate(100, 'fixed_amount', 25, 200);
      expect(newPrice).toBe(125);
    });

    it('applies direct price capped at MRP', () => {
      const newPrice = applyBulkPriceUpdate(100, 'direct_price', 180, 150);
      expect(newPrice).toBe(150);
    });
  });
});
