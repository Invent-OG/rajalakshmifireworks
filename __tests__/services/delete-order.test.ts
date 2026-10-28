import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteOrder } from '@/lib/services/order-service';
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

describe('Order Service: deleteOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws ValidationError if order does not exist', async () => {
    const mockTx = {
      query: {
        orders: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      },
    };

    (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

    await expect(deleteOrder(999, 'admin@rajalakshmifireworks.com')).rejects.toThrow(
      'Order not found'
    );
  });

  it('permanently deletes cancelled order without adjusting inventory', async () => {
    const mockDelete = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(true),
    });

    const mockTx = {
      query: {
        orders: {
          findFirst: vi.fn().mockResolvedValue({
            id: 201,
            invoiceNumber: 'INV-201',
            orderStatus: 'CANCELLED',
            items: [{ productId: 5, quantity: 2, productNameSnapshot: 'Flower Pots' }],
          }),
        },
      },
      update: vi.fn(),
      insert: vi.fn(),
      delete: mockDelete,
    };

    (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

    const result = await deleteOrder(201, 'admin@rajalakshmifireworks.com');

    expect(result).toEqual({ success: true, orderId: 201 });
    // Inventory should not be updated since order was already CANCELLED
    expect(mockTx.update).not.toHaveBeenCalled();
    expect(mockTx.insert).not.toHaveBeenCalled();
    // Records should be deleted
    expect(mockDelete).toHaveBeenCalled();
  });

  it('restores inventory when deleting an active order', async () => {
    const mockDelete = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(true),
    });
    const mockUpdateWhere = vi.fn().mockResolvedValue(true);
    const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
    const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });

    const mockInsertValues = vi.fn().mockResolvedValue(true);
    const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });

    const mockTx = {
      query: {
        orders: {
          findFirst: vi.fn().mockResolvedValue({
            id: 301,
            invoiceNumber: 'INV-301',
            orderStatus: 'CONFIRMED',
            items: [{ productId: 10, quantity: 5, productNameSnapshot: 'Sparklers' }],
          }),
        },
        products: {
          findFirst: vi.fn().mockResolvedValue({
            id: 10,
            name: 'Sparklers',
            stockQuantity: 20,
          }),
        },
      },
      update: mockUpdate,
      insert: mockInsert,
      delete: mockDelete,
    };

    (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

    const result = await deleteOrder(301, 'admin@rajalakshmifireworks.com');

    expect(result).toEqual({ success: true, orderId: 301 });
    // Stock should be restored: 20 + 5 = 25
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ stockQuantity: 25 })
    );
    // Inventory transaction record created
    expect(mockInsert).toHaveBeenCalled();
    // Delete called for child tables and order
    expect(mockDelete).toHaveBeenCalled();
  });
});
