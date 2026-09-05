import { NextRequest } from 'next/server';
import { db } from '@/db';
import { products, inventoryTransactions } from '@/db/schema';
import { eq, and, ilike, sql, desc, asc } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '25', 10)));
  const offset = (page - 1) * limit;
  const search = searchParams.get('search')?.trim();
  const filter = searchParams.get('filter'); // 'all' | 'low' | 'out' | 'healthy'
  const view = searchParams.get('view') || 'stock'; // 'stock' | 'audit'

  try {
    if (view === 'audit') {
      // Audit log view
      const [auditLogs, auditCountResult] = await Promise.all([
        db.query.inventoryTransactions.findMany({
          with: {
            product: { columns: { id: true, name: true, sku: true } },
          },
          orderBy: [desc(inventoryTransactions.createdAt)],
          limit,
          offset,
        }),
        db.select({ count: sql<number>`count(*)` }).from(inventoryTransactions),
      ]);

      const auditTotal = Number(auditCountResult[0]?.count ?? 0);

      return Response.json({
        auditLogs,
        pagination: {
          page,
          limit,
          total: auditTotal,
          totalPages: Math.ceil(auditTotal / limit) || 1,
        },
      });
    }

    // Stock balances view
    const conditions = [eq(products.isActive, true)];

    if (search) {
      conditions.push(
        sql`(${products.name} ILIKE ${`%${search}%`} OR ${products.sku} ILIKE ${`%${search}%`})`
      );
    }

    if (filter === 'low') {
      conditions.push(
        sql`${products.stockQuantity} <= ${products.lowStockThreshold} AND ${products.stockQuantity} > 0`
      );
    } else if (filter === 'out') {
      conditions.push(eq(products.stockQuantity, 0));
    } else if (filter === 'healthy') {
      conditions.push(sql`${products.stockQuantity} > ${products.lowStockThreshold}`);
    }

    const whereClause = and(...conditions);

    const [items, countResult, statsResult] = await Promise.all([
      db.query.products.findMany({
        where: whereClause,
        with: {
          category: { columns: { id: true, name: true } },
        },
        orderBy: [products.stockQuantity, desc(products.updatedAt)],
        limit,
        offset,
      }),
      db.select({ count: sql<number>`count(*)` }).from(products).where(whereClause),
      db
        .select({
          totalProducts: sql<number>`count(*)`,
          totalStockUnits: sql<number>`coalesce(sum(${products.stockQuantity}), 0)`,
          lowStockCount: sql<number>`count(*) filter (where ${products.stockQuantity} <= ${products.lowStockThreshold} and ${products.stockQuantity} > 0)`,
          outOfStockCount: sql<number>`count(*) filter (where ${products.stockQuantity} = 0)`,
        })
        .from(products)
        .where(eq(products.isActive, true)),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    const stats = statsResult[0] || {
      totalProducts: 0,
      totalStockUnits: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
    };

    return Response.json({
      inventory: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats: {
        totalProducts: Number(stats.totalProducts),
        totalStockUnits: Number(stats.totalStockUnits),
        lowStockCount: Number(stats.lowStockCount),
        outOfStockCount: Number(stats.outOfStockCount),
      },
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return Response.json({ message: 'Failed to load inventory' }, { status: 500 });
  }
}
