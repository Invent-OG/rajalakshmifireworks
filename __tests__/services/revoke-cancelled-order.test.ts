import { describe, it, expect, vi, beforeEach } from 'vitest';
import { revokeCancelledOrder } from '@/lib/services/order-service';
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

describe('Order Service: revokeCancelledOrder', () => {
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

    await expect(
      revokeCancelledOrder({
        orderId: 999,
        revokedBy: 'admin@rajalakshmifireworks.com',
      })
    ).rejects.toThrow('Order not found');
  });

  it('throws ValidationError if order is not in CANCELLED status', async () => {
    const mockTx = {
      query: {
        orders: {
          findFirst: vi.fn().mockResolvedValue({
            id: 101,
            orderStatus: 'CONFIRMED',
            items: [],
          }),
        },
      },
    };

    (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

    await expect(
      revokeCancelledOrder({
        orderId: 101,
        revokedBy: 'admin@rajalakshmifireworks.com',
      })
    ).rejects.toThrow('Only cancelled orders can be revoked.');
  });

  it('rejects invalid target status outside NEW and CONFIRMED', async () => {
    const mockTx = {
      query: {
        orders: {
          findFirst: vi.fn().mockResolvedValue({
            id: 101,
            orderStatus: 'CANCELLED',
            items: [],
          }),
        },
      },
    };

    (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

    await expect(
      revokeCancelledOrder({
        orderId: 101,
        revokedBy: 'admin@rajalakshmifireworks.com',
        targetStatus: 'DELIVERED' as any,
      })
    ).rejects.toThrow('Invalid target status. Orders can only be restored to NEW or CONFIRMED.');
  });

  it('throws InsufficientStockError when warehouse stock is less than required quantity', async () => {
    const mockOrder = {
      id: 101,
      invoiceNumber: 'FW-202610-101',
      orderStatus: 'CANCELLED',
      paymentStatus: 'PENDING',
      items: [
        {
          id: 1,
          productId: 10,
          productNameSnapshot: 'Chakkars Special',
          quantity: 5,
        },
      ],
    };

    const mockProduct = {
      id: 10,
      name: 'Chakkars Special',
      stockQuantity: 2, // Less than 5 required!
    };

    const mockTx = {
      query: {
        orders: {
          findFirst: vi.fn().mockResolvedValue(mockOrder),
        },
        products: {
          findFirst: vi.fn().mockResolvedValue(mockProduct),
        },
      },
    };

    (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

    await expect(
      revokeCancelledOrder({
        orderId: 101,
        revokedBy: 'admin@rajalakshmifireworks.com',
      })
    ).rejects.toThrow(/insufficient stock/i);
  });

  it('successfully revokes cancellation, re-reserves stock, and restores order status', async () => {
    const mockOrder = {
      id: 101,
      invoiceNumber: 'FW-202610-101',
      orderStatus: 'CANCELLED',
      paymentStatus: 'PAID',
      items: [
        {
          id: 1,
          productId: 10,
          productNameSnapshot: 'Sparklers 15cm',
          quantity: 3,
        },
      ],
    };

    const mockProduct = {
      id: 10,
      name: 'Sparklers 15cm',
      stockQuantity: 10,
    };

    const updateMock = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    });

    const insertMock = vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue({}),
    });

    const mockTx = {
      query: {
        orders: {
          findFirst: vi.fn().mockResolvedValue(mockOrder),
        },
        products: {
          findFirst: vi.fn().mockResolvedValue(mockProduct),
        },
      },
      update: updateMock,
      insert: insertMock,
    };

    (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

    const result = await revokeCancelledOrder({
      orderId: 101,
      revokedBy: 'admin@rajalakshmifireworks.com',
      note: 'Reopened by manager request',
    });

    expect(result.orderId).toBe(101);
    // Since paymentStatus was PAID, defaults to CONFIRMED
    expect(result.targetStatus).toBe('CONFIRMED');

    // Verify product stock deduction update was called
    expect(updateMock).toHaveBeenCalled();
    // Verify inventory transaction & status history inserts were called
    expect(insertMock).toHaveBeenCalled();
  });
});
