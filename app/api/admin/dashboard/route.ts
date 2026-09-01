import { db } from '@/db';
import { orders, products, customers } from '@/db/schema';
import { eq, sql, gte, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      todayOrdersResult,
      todaySalesResult,
      pendingResult,
      confirmedResult,
      readyResult,
      outForDeliveryResult,
      completedTodayResult,
      totalCustomersResult,
      lowStockResult,
      recentOrders,
    ] = await Promise.all([
      // Today's order count
      db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(gte(orders.placedAt, today)),

      // Today's sales total (completed orders)
      db.select({ total: sql<string>`COALESCE(SUM(total_amount::numeric), 0)` })
        .from(orders)
        .where(and(gte(orders.placedAt, today), eq(orders.orderStatus, 'COMPLETED'))),

      // Pending orders
      db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.orderStatus, 'PENDING')),

      // Confirmed orders
      db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.orderStatus, 'CONFIRMED')),

      // Ready orders
      db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(sql`${orders.orderStatus} IN ('READY', 'READY_FOR_PICKUP')`),

      // Out for delivery
      db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.orderStatus, 'OUT_FOR_DELIVERY')),

      // Completed today
      db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(and(gte(orders.completedAt, today), eq(orders.orderStatus, 'COMPLETED'))),

      // Total customers
      db.select({ count: sql<number>`count(*)` }).from(customers),

      // Low stock products
      db.select({ count: sql<number>`count(*)` })
        .from(products)
        .where(and(
          eq(products.isActive, true),
          sql`${products.stockQuantity} <= ${products.lowStockThreshold}`
        )),

      // Recent 10 orders
      db.query.orders.findMany({
        with: { items: true },
        orderBy: (o, { desc }) => [desc(o.placedAt)],
        limit: 10,
      }),
    ]);

    return Response.json({
      dashboard: {
        todayOrders: Number(todayOrdersResult[0]?.count ?? 0),
        todaySales: Number(todaySalesResult[0]?.total ?? 0),
        pendingOrders: Number(pendingResult[0]?.count ?? 0),
        confirmedOrders: Number(confirmedResult[0]?.count ?? 0),
        readyOrders: Number(readyResult[0]?.count ?? 0),
        outForDelivery: Number(outForDeliveryResult[0]?.count ?? 0),
        completedToday: Number(completedTodayResult[0]?.count ?? 0),
        totalCustomers: Number(totalCustomersResult[0]?.count ?? 0),
        lowStockProducts: Number(lowStockResult[0]?.count ?? 0),
        recentOrders,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return Response.json({ message: 'Failed to load dashboard' }, { status: 500 });
  }
}
