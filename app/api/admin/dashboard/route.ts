import { db } from '@/db';
import { orders, products, customers, deliveryPartners } from '@/db/schema';
import { eq, sql, gte, and, inArray } from 'drizzle-orm';
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
      newOrdersResult,
      confirmedResult,
      assignedResult,
      outForDeliveryResult,
      deliveredTodayResult,
      totalCustomersResult,
      activePartnersResult,
      lowStockResult,
      recentOrders,
    ] = await Promise.all([
      // Today's order count
      db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(gte(orders.placedAt, today)),

      // Today's sales total (delivered/completed orders)
      db.select({ total: sql<string>`COALESCE(SUM(total_amount::numeric), 0)` })
        .from(orders)
        .where(and(gte(orders.placedAt, today), inArray(orders.orderStatus, ['DELIVERED', 'COMPLETED']))),

      // New / Pending orders
      db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(inArray(orders.orderStatus, ['NEW', 'PENDING'])),

      // Confirmed orders
      db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.orderStatus, 'CONFIRMED')),

      // Assigned orders
      db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.orderStatus, 'ASSIGNED')),

      // Out for delivery
      db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.orderStatus, 'OUT_FOR_DELIVERY')),

      // Delivered / Completed today
      db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(and(gte(orders.deliveredAt, today), inArray(orders.orderStatus, ['DELIVERED', 'COMPLETED']))),

      // Total customers
      db.select({ count: sql<number>`count(*)` }).from(customers),

      // Active delivery partners
      db.select({ count: sql<number>`count(*)` })
        .from(deliveryPartners)
        .where(eq(deliveryPartners.status, 'ACTIVE')),

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
        newOrders: Number(newOrdersResult[0]?.count ?? 0),
        pendingOrders: Number(newOrdersResult[0]?.count ?? 0),
        confirmedOrders: Number(confirmedResult[0]?.count ?? 0),
        assignedOrders: Number(assignedResult[0]?.count ?? 0),
        outForDelivery: Number(outForDeliveryResult[0]?.count ?? 0),
        completedToday: Number(deliveredTodayResult[0]?.count ?? 0),
        deliveredToday: Number(deliveredTodayResult[0]?.count ?? 0),
        totalCustomers: Number(totalCustomersResult[0]?.count ?? 0),
        activeDeliveryPartners: Number(activePartnersResult[0]?.count ?? 0),
        lowStockProducts: Number(lowStockResult[0]?.count ?? 0),
        recentOrders,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return Response.json({ message: 'Failed to load dashboard' }, { status: 500 });
  }
}
