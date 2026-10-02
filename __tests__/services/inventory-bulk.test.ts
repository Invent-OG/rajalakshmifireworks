import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bulkAdjustStock } from '@/lib/services/inventory-service';
import { db } from '@/db';

vi.mock('@/db', () => ({
  db: {
    transaction: vi.fn(),
  },
}));

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Inventory Service: bulkAdjustStock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('successfully processes ADD adjustments in a transaction', async () => {
    const mockProducts = [
      { id: 1, name: 'Standard Sparklers', sku: 'SPK-01', stockQuantity: 20 },
      { id: 2, name: 'Flower Pots Big', sku: 'FLP-02', stockQuantity: 15 },
    ];

    const mockTx = {
      query: {
        products: {
          findMany: vi.fn().mockResolvedValue(mockProducts),
        },
      },
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue({}),
      }),
    };

    (db.transaction as any).mockImplementation(async (callback: any) => {
      return await callback(mockTx);
    });

    const result = await bulkAdjustStock({
      mode: 'ADD',
      quantity: 50,
      items: [{ productId: 1 }, { productId: 2 }],
      defaultNote: 'Factory shipment lot #101',
      performedBy: 'admin@rajalakshmifireworks.com',
    });

    expect(result.success).toBe(true);
    expect(result.updatedCount).toBe(2);
    expect(result.results[0].newStock).toBe(70);
    expect(result.results[1].newStock).toBe(65);
    expect(mockTx.update).toHaveBeenCalledTimes(2);
    expect(mockTx.insert).toHaveBeenCalledTimes(2);
  });

  it('successfully processes SET mode to update exact stock count', async () => {
    const mockProducts = [
      { id: 3, name: 'Ground Chakkar Deluxe', sku: 'CHK-03', stockQuantity: 45 },
    ];

    const mockTx = {
      query: {
        products: {
          findMany: vi.fn().mockResolvedValue(mockProducts),
        },
      },
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue({}),
      }),
    };

    (db.transaction as any).mockImplementation(async (callback: any) => {
      return await callback(mockTx);
    });

    const result = await bulkAdjustStock({
      mode: 'SET',
      quantity: 100,
      items: [{ productId: 3 }],
      defaultNote: 'Stock audit count match',
      performedBy: 'admin@rajalakshmifireworks.com',
    });

    expect(result.success).toBe(true);
    expect(result.results[0].oldStock).toBe(45);
    expect(result.results[0].newStock).toBe(100);
    expect(result.results[0].quantityChange).toBe(55);
  });

  it('throws ValidationError if deduction would result in negative stock', async () => {
    const mockProducts = [
      { id: 1, name: '1000 Wala Crackers', sku: 'WAL-100', stockQuantity: 5 },
    ];

    const mockTx = {
      query: {
        products: {
          findMany: vi.fn().mockResolvedValue(mockProducts),
        },
      },
      update: vi.fn(),
      insert: vi.fn(),
    };

    (db.transaction as any).mockImplementation(async (callback: any) => {
      return await callback(mockTx);
    });

    await expect(
      bulkAdjustStock({
        mode: 'REMOVE',
        quantity: 10,
        items: [{ productId: 1 }],
        performedBy: 'admin@rajalakshmifireworks.com',
      })
    ).rejects.toThrow(/Cannot reduce stock below 0/);
  });

  it('throws ValidationError if a product is not found', async () => {
    const mockTx = {
      query: {
        products: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      },
    };

    (db.transaction as any).mockImplementation(async (callback: any) => {
      return await callback(mockTx);
    });

    await expect(
      bulkAdjustStock({
        mode: 'ADD',
        quantity: 10,
        items: [{ sku: 'NON-EXISTENT-SKU' }],
        performedBy: 'admin@rajalakshmifireworks.com',
      })
    ).rejects.toThrow(/Product not found: SKU "NON-EXISTENT-SKU"/);
  });

  it('supports CUSTOM mode with per-item newStock values', async () => {
    const mockProducts = [
      { id: 10, name: 'Sky Shots 12', sku: 'SKY-12', stockQuantity: 8 },
      { id: 11, name: 'Rocket Bomb', sku: 'RKT-01', stockQuantity: 50 },
    ];

    const mockTx = {
      query: {
        products: {
          findMany: vi.fn().mockResolvedValue(mockProducts),
        },
      },
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue({}),
      }),
    };

    (db.transaction as any).mockImplementation(async (callback: any) => {
      return await callback(mockTx);
    });

    const result = await bulkAdjustStock({
      mode: 'CUSTOM',
      items: [
        { productId: 10, newStock: 25 },
        { productId: 11, newStock: 40 },
      ],
      defaultNote: 'Inventory CSV import',
      performedBy: 'admin@rajalakshmifireworks.com',
    });

    expect(result.success).toBe(true);
    expect(result.results[0].newStock).toBe(25);
    expect(result.results[0].quantityChange).toBe(17);
    expect(result.results[1].newStock).toBe(40);
    expect(result.results[1].quantityChange).toBe(-10);
  });
});
