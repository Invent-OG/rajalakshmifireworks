import { NextRequest } from 'next/server';
import { db } from '@/db';
import { products, inventoryTransactions } from '@/db/schema';
import { eq, and, ilike, sql, desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search')?.trim();
  const filter = searchParams.get('filter'); // 'all' | 'low' | 'out'

  try {
    const conditions = [eq(products.isActive, true)];

    if (search) {
      conditions.push(ilike(products.name, `%${search}%`));
    }

    if (filter === 'low') {
      conditions.push(
        sql`${products.stockQuantity} <= ${products.lowStockThreshold} AND ${products.stockQuantity} > 0`
      );
    } else if (filter === 'out') {
      conditions.push(eq(products.stockQuantity, 0));
    }

    const [items, recentHistory] = await Promise.all([
      db.query.products.findMany({
        where: and(...conditions),
        with: {
          category: { columns: { id: true, name: true } },
        },
        orderBy: [products.stockQuantity, desc(products.updatedAt)],
      }),
      db.query.inventoryTransactions.findMany({
        with: {
          product: { columns: { id: true, name: true, sku: true } },
        },
        orderBy: [desc(inventoryTransactions.createdAt)],
        limit: 25,
      }),
    ]);

    const totalStockUnits = items.reduce((sum, item) => sum + item.stockQuantity, 0);
    const lowStockCount = items.filter(
      (item) => item.stockQuantity > 0 && item.stockQuantity <= item.lowStockThreshold
    ).length;
    const outOfStockCount = items.filter((item) => item.stockQuantity === 0).length;

    return Response.json({
      inventory: items,
      recentHistory,
      stats: {
        totalProducts: items.length,
        totalStockUnits,
        lowStockCount,
        outOfStockCount,
      },
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return Response.json({ message: 'Failed to load inventory' }, { status: 500 });
  }
}
