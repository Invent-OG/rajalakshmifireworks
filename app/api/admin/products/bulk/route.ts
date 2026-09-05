import { NextRequest } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { inArray, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const bulkProductActionSchema = z.object({
  productIds: z.array(z.number().int().positive()).min(1, 'Please select at least one product'),
  action: z.enum(['ACTIVATE', 'DEACTIVATE', 'SET_CATEGORY', 'ADJUST_PRICE']),
  categoryId: z.number().int().positive().optional(),
  percentageChange: z.number().min(-90).max(500).optional(),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = bulkProductActionSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { message: 'Validation failed', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { productIds, action, categoryId, percentageChange } = parsed.data;

    let updatedCount = 0;

    await db.transaction(async (tx) => {
      switch (action) {
        case 'ACTIVATE':
          await tx
            .update(products)
            .set({ isActive: true, updatedAt: new Date() })
            .where(inArray(products.id, productIds));
          updatedCount = productIds.length;
          break;

        case 'DEACTIVATE':
          await tx
            .update(products)
            .set({ isActive: false, updatedAt: new Date() })
            .where(inArray(products.id, productIds));
          updatedCount = productIds.length;
          break;

        case 'SET_CATEGORY':
          if (!categoryId) {
            throw new Error('Category ID is required for category assignment');
          }
          await tx
            .update(products)
            .set({ categoryId, updatedAt: new Date() })
            .where(inArray(products.id, productIds));
          updatedCount = productIds.length;
          break;

        case 'ADJUST_PRICE':
          if (percentageChange === undefined || percentageChange === 0) {
            throw new Error('Valid percentage change is required');
          }
          const multiplier = 1 + percentageChange / 100;
          await tx
            .update(products)
            .set({
              sellingPrice: sql`ROUND(CAST(${products.sellingPrice} AS NUMERIC) * ${multiplier}, 2)`,
              updatedAt: new Date(),
            })
            .where(inArray(products.id, productIds));
          updatedCount = productIds.length;
          break;
      }
    });

    logger.info('admin.products.bulk', 'Bulk product update completed', {
      action,
      totalRequested: productIds.length,
      updatedCount,
      adminEmail: session.email,
    });

    return Response.json({
      success: true,
      updatedCount,
      action,
    });
  } catch (error) {
    logger.error('admin.products.bulk', 'Bulk product action failed', {
      error: (error as Error).message,
    });
    return Response.json(
      { message: (error as Error).message || 'Failed to execute bulk action' },
      { status: 500 }
    );
  }
}
