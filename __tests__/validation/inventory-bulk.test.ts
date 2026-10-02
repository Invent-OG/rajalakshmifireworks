import { describe, it, expect } from 'vitest';
import { bulkStockAdjustmentSchema } from '@/lib/validation/admin';

describe('Bulk Stock Adjustment Validation Schema', () => {
  it('validates a valid ADD mode payload with product IDs', () => {
    const payload = {
      mode: 'ADD',
      quantity: 50,
      defaultNote: 'Factory delivery arrived',
      items: [{ productId: 1 }, { productId: 2 }],
    };

    const parsed = bulkStockAdjustmentSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.mode).toBe('ADD');
      expect(parsed.data.quantity).toBe(50);
      expect(parsed.data.items.length).toBe(2);
    }
  });

  it('validates a valid REMOVE mode payload with SKUs', () => {
    const payload = {
      mode: 'REMOVE',
      quantity: 5,
      defaultNote: 'Damaged during transit',
      items: [{ sku: 'SKU-001' }, { sku: 'SKU-002' }],
    };

    const parsed = bulkStockAdjustmentSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.mode).toBe('REMOVE');
      expect(parsed.data.quantity).toBe(5);
    }
  });

  it('validates a valid SET mode payload', () => {
    const payload = {
      mode: 'SET',
      quantity: 100,
      items: [{ productId: 10 }],
    };

    const parsed = bulkStockAdjustmentSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.mode).toBe('SET');
      expect(parsed.data.quantity).toBe(100);
    }
  });

  it('validates CUSTOM mode with per-item newStock and quantityChange', () => {
    const payload = {
      mode: 'CUSTOM',
      defaultNote: 'Spreadsheet import',
      items: [
        { productId: 1, newStock: 120, note: 'Physical recount' },
        { sku: 'SPARK-05', quantityChange: -10 },
      ],
    };

    const parsed = bulkStockAdjustmentSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.items[0].newStock).toBe(120);
      expect(parsed.data.items[1].quantityChange).toBe(-10);
    }
  });

  it('rejects payload with empty items array', () => {
    const payload = {
      mode: 'ADD',
      quantity: 10,
      items: [],
    };

    const parsed = bulkStockAdjustmentSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });

  it('rejects items missing both productId and sku', () => {
    const payload = {
      mode: 'ADD',
      quantity: 10,
      items: [{ note: 'Missing ID and SKU' }],
    };

    const parsed = bulkStockAdjustmentSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });

  it('rejects negative newStock', () => {
    const payload = {
      mode: 'CUSTOM',
      items: [{ productId: 1, newStock: -5 }],
    };

    const parsed = bulkStockAdjustmentSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });

  it('rejects unsupported mode', () => {
    const payload = {
      mode: 'MULTIPLY',
      quantity: 2,
      items: [{ productId: 1 }],
    };

    const parsed = bulkStockAdjustmentSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });
});
