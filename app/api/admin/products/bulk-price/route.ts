import { NextRequest } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { bulkPriceUpdateSchema } from '@/lib/validation/product';
import { applyBulkPriceUpdate } from '@/lib/services/pricing-service';
import { toNumber } from '@/lib/utils/format';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const result = bulkPriceUpdateSchema.safeParse(body);

    if (!result.success) {
      return Response.json({ message: 'Validation failed', errors: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const { productIds, updateType, value } = result.data;

    // Fetch all products
    const productList = await db.query.products.findMany({
      where: inArray(products.id, productIds),
    });

    // Calculate preview if requested
    if (request.nextUrl.searchParams.get('preview') === 'true') {
      const preview = productList.map((p) => {
        const currentPrice = toNumber(p.sellingPrice);
        const mrp = toNumber(p.mrp);
        const newPrice = applyBulkPriceUpdate(currentPrice, updateType, value, mrp);
        return {
          id: p.id,
          name: p.name,
          currentPrice,
          newPrice,
          difference: newPrice - currentPrice,
          mrp,
        };
      });
      return Response.json({ preview });
    }

    // Apply updates in a transaction
    await db.transaction(async (tx) => {
      for (const product of productList) {
        const currentPrice = toNumber(product.sellingPrice);
        const mrp = toNumber(product.mrp);
        const newPrice = applyBulkPriceUpdate(currentPrice, updateType, value, mrp);

        await tx.update(products).set({
          sellingPrice: String(newPrice),
          updatedAt: new Date(),
        }).where(eq(products.id, product.id));
      }
    });

    logger.info('product.bulkPrice', 'Bulk price update applied', {
      productCount: productIds.length,
      updateType,
      value,
      performedBy: session.email,
    });

    return Response.json({ success: true, updatedCount: productList.length });
  } catch (error) {
    console.error('Error in bulk price update:', error);
    return Response.json({ message: 'Failed to update prices' }, { status: 500 });
  }
}
