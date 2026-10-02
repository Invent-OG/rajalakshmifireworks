import { db } from '@/db';
import { products, inventoryTransactions } from '@/db/schema';
import type { InventoryTransactionType } from '@/db/schema';
import { eq, inArray, or } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';
import { ValidationError } from '@/lib/utils/errors';
import * as XLSX from 'xlsx';


export interface StockAdjustment {
  productId: number;
  quantityChange: number;
  type: InventoryTransactionType;
  note?: string;
  performedBy: string;
}

export interface BulkStockItem {
  productId?: number;
  sku?: string;
  quantityChange?: number;
  newStock?: number;
  note?: string;
}

export interface BulkStockAdjustmentOptions {
  mode: 'ADD' | 'REMOVE' | 'SET' | 'CUSTOM';
  quantity?: number;
  items: BulkStockItem[];
  defaultNote?: string;
  performedBy: string;
}

export interface BulkAdjustmentItemResult {
  productId: number;
  name: string;
  sku: string | null;
  oldStock: number;
  newStock: number;
  quantityChange: number;
}

export interface BulkAdjustmentResult {
  success: boolean;
  totalRequested: number;
  updatedCount: number;
  results: BulkAdjustmentItemResult[];
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
 * Adjust stock for multiple products in a single atomic transaction.
 * Supports ADD (+qty), REMOVE (-qty), SET (=qty), or CUSTOM (per-item) adjustments.
 */
export async function bulkAdjustStock(
  options: BulkStockAdjustmentOptions
): Promise<BulkAdjustmentResult> {
  if (!options.items || options.items.length === 0) {
    throw new ValidationError('No products provided for bulk adjustment');
  }

  if (options.mode === 'ADD' && options.quantity !== undefined && options.quantity <= 0) {
    throw new ValidationError('Quantity to add must be greater than 0');
  }

  if (options.mode === 'REMOVE' && options.quantity !== undefined && options.quantity <= 0) {
    throw new ValidationError('Quantity to deduct must be greater than 0');
  }

  if (options.mode === 'SET' && options.quantity !== undefined && options.quantity < 0) {
    throw new ValidationError('Stock quantity cannot be negative');
  }

  return await db.transaction(async (tx) => {
    // 1. Gather all product IDs and SKUs to fetch in bulk
    const productIds = options.items
      .map((i) => i.productId)
      .filter((id): id is number => typeof id === 'number');
    const skus = options.items
      .map((i) => i.sku?.trim())
      .filter((s): s is string => !!s);

    const conditions = [];
    if (productIds.length > 0) conditions.push(inArray(products.id, productIds));
    if (skus.length > 0) conditions.push(inArray(products.sku, skus));

    if (conditions.length === 0) {
      throw new ValidationError('No valid product IDs or SKUs provided');
    }

    const matchedProducts = await tx.query.products.findMany({
      where: conditions.length > 1 ? or(...conditions) : conditions[0],
    });

    const productById = new Map(matchedProducts.map((p) => [p.id, p]));
    const productBySku = new Map(
      matchedProducts.filter((p) => p.sku).map((p) => [p.sku!.toLowerCase(), p])
    );

    // Track running stock per product (in case duplicates appear in list)
    const runningStock = new Map<number, number>();
    for (const p of matchedProducts) {
      runningStock.set(p.id, p.stockQuantity);
    }

    const results: BulkAdjustmentItemResult[] = [];

    // 2. Process each adjustment item
    for (const item of options.items) {
      const product =
        (item.productId ? productById.get(item.productId) : undefined) ||
        (item.sku ? productBySku.get(item.sku.toLowerCase()) : undefined);

      if (!product) {
        const identifier = item.sku ? `SKU "${item.sku}"` : `ID #${item.productId}`;
        throw new ValidationError(`Product not found: ${identifier}`);
      }

      const currentStock = runningStock.get(product.id) ?? product.stockQuantity;
      let delta = 0;
      let newStock = currentStock;
      let txType: InventoryTransactionType = 'MANUAL_ADJUSTMENT';

      if (options.mode === 'ADD') {
        delta = options.quantity ?? item.quantityChange ?? 0;
        if (delta <= 0) {
          throw new ValidationError(`Quantity to add must be greater than 0 for "${product.name}"`);
        }
        newStock = currentStock + delta;
        txType = 'STOCK_ADDED';
      } else if (options.mode === 'REMOVE') {
        const deduct =
          options.quantity ??
          (item.quantityChange !== undefined ? Math.abs(item.quantityChange) : 0);
        if (deduct <= 0) {
          throw new ValidationError(
            `Quantity to deduct must be greater than 0 for "${product.name}"`
          );
        }
        delta = -deduct;
        newStock = currentStock + delta;
        txType = 'STOCK_REMOVED';
      } else if (options.mode === 'SET') {
        const target = options.quantity !== undefined ? options.quantity : item.newStock;
        if (target === undefined || target < 0) {
          throw new ValidationError(
            `Target stock must be a non-negative number for "${product.name}"`
          );
        }
        newStock = target;
        delta = target - currentStock;
        txType =
          delta > 0 ? 'STOCK_ADDED' : delta < 0 ? 'STOCK_REMOVED' : 'MANUAL_ADJUSTMENT';
      } else if (options.mode === 'CUSTOM') {
        if (item.newStock !== undefined) {
          if (item.newStock < 0) {
            throw new ValidationError(`Stock cannot be negative for "${product.name}"`);
          }
          newStock = item.newStock;
          delta = newStock - currentStock;
        } else if (item.quantityChange !== undefined) {
          delta = item.quantityChange;
          newStock = currentStock + delta;
        } else {
          throw new ValidationError(
            `Missing new stock quantity or adjustment for "${product.name}"`
          );
        }
        txType =
          delta > 0 ? 'STOCK_ADDED' : delta < 0 ? 'STOCK_REMOVED' : 'MANUAL_ADJUSTMENT';
      }

      if (newStock < 0) {
        throw new ValidationError(
          `Cannot reduce stock below 0 for "${product.name}". Current: ${currentStock}, Change: ${delta}`
        );
      }

      runningStock.set(product.id, newStock);

      // Update product record
      await tx
        .update(products)
        .set({
          stockQuantity: newStock,
          updatedAt: new Date(),
        })
        .where(eq(products.id, product.id));

      // Record audit transaction
      await tx.insert(inventoryTransactions).values({
        productId: product.id,
        type: txType,
        quantityChange: delta,
        quantityAfter: newStock,
        note: item.note || options.defaultNote || `Bulk stock update (${options.mode})`,
        performedBy: options.performedBy,
      });

      results.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        oldStock: currentStock,
        newStock,
        quantityChange: delta,
      });
    }

    logger.info('inventory.bulkAdjust', 'Bulk stock adjustment completed', {
      mode: options.mode,
      totalRequested: options.items.length,
      updatedCount: results.length,
      performedBy: options.performedBy,
    });

    return {
      success: true,
      totalRequested: options.items.length,
      updatedCount: results.length,
      results,
    };
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

/**
 * Generate an Excel workbook template pre-filled with all active fireworks and their current stock.
 */
export async function generateBulkStockTemplate(): Promise<Buffer> {
  const activeProducts = await db.query.products.findMany({
    where: eq(products.isActive, true),
    with: {
      category: { columns: { name: true } },
    },
    orderBy: [products.name],
  });

  const wb = XLSX.utils.book_new();

  const headers = [
    'Product ID',
    'SKU',
    'Product Name',
    'Category',
    'Current Stock',
    'New Stock Quantity (Set Exact)',
    'Stock Adjustment (+/-)',
  ];

  const rows = activeProducts.map((p) => [
    p.id,
    p.sku || '',
    p.name,
    p.category?.name || 'Uncategorized',
    p.stockQuantity,
    '', // New Stock Quantity (empty for user to fill)
    '', // Stock Adjustment (empty for user to fill)
  ]);

  const wsStock = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  wsStock['!cols'] = [
    { wch: 12 },
    { wch: 18 },
    { wch: 35 },
    { wch: 20 },
    { wch: 15 },
    { wch: 30 },
    { wch: 25 },
  ];

  XLSX.utils.book_append_sheet(wb, wsStock, 'Stock Update');

  const instructions = [
    ['Rajalakshmi Fireworks - Bulk Stock Update Guide'],
    [''],
    ['How to use this template:'],
    ['1. Do NOT modify the "Product ID" or "SKU" columns, as these are used to match catalog products.'],
    ['2. To set exact stock count: Enter the absolute number in "New Stock Quantity (Set Exact)".'],
    ['3. To add or remove stock: Enter a positive number (e.g. 50) or negative number (e.g. -5) in "Stock Adjustment (+/-)".'],
    ['4. If both columns are provided for a row, "New Stock Quantity" takes precedence.'],
    ['5. Leave both columns blank for products whose stock you do not wish to change.'],
    ['6. Stock quantity cannot drop below 0.'],
    ['7. Save this file and upload it in the Admin Inventory -> "Bulk Stock Import" modal.'],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
  wsInstructions['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}


