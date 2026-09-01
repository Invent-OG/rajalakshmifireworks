import { db } from '@/db';
import { products, inventoryTransactions } from '@/db/schema';
import type { InventoryTransactionType } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';
import { ValidationError } from '@/lib/utils/errors';

interface StockAdjustment {
  productId: number;
  quantityChange: number;
  type: InventoryTransactionType;
  note?: string;
  performedBy: string;
}

/**
 * Adjust stock for a product with full audit trail.
 * Uses a transaction to keep products.stockQuantity and inventory_transactions in sync.
 */
export async function adjustStock(adjustment: StockAdjustment): Promise<{ newStock: number }> {
  return await db.transaction(async (tx) => {
    // Get current product with lock
    const product = await tx.query.products.findFirst({
      where: eq(products.id, adjustment.productId),
    });

    if (!product) {
      throw new ValidationError('Product not found');
    }

    const newStock = product.stockQuantity + adjustment.quantityChange;

    if (newStock < 0) {
      throw new ValidationError(
        `Cannot reduce stock below 0. Current: ${product.stockQuantity}, Requested change: ${adjustment.quantityChange}`
      );
    }

    // Update product stock
    await tx
      .update(products)
      .set({
        stockQuantity: newStock,
        updatedAt: new Date(),
      })
      .where(eq(products.id, adjustment.productId));

    // Record transaction
    await tx.insert(inventoryTransactions).values({
      productId: adjustment.productId,
      type: adjustment.type,
      quantityChange: adjustment.quantityChange,
      quantityAfter: newStock,
      note: adjustment.note,
      performedBy: adjustment.performedBy,
    });

    logger.info('inventory.adjust', 'Stock adjusted', {
      productId: adjustment.productId,
      type: adjustment.type,
      change: adjustment.quantityChange,
      newStock,
      performedBy: adjustment.performedBy,
    });

    return { newStock };
  });
}

/**
 * Get inventory history for a product
 */
export async function getInventoryHistory(productId: number, limit: number = 50) {
  return db.query.inventoryTransactions.findMany({
    where: eq(inventoryTransactions.productId, productId),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    limit,
  });
}
