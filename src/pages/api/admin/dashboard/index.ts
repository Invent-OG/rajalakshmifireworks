import { wrapHandler } from '@/src/lib/astro-api';
import { db } from '@/db';
import { orders, products, customers, deliveryPartners, orderItems } from '@/db/schema';
import { eq, sql, gte, and, inArray } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';

async function _GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      allOrdersCountResult,
      allTimeRevenueResult,
      allProductsSoldResult,
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
      // Total orders count across all time
      db.select({ count: sql<number>`count(*)` }).from(orders),

      // Total revenue across all non-cancelled orders
      db.select({ total: sql<string>`COALESCE(SUM(total_amount::numeric), 0)` })
        .from(orders)
        .where(sql`${orders.orderStatus} != 'CANCELLED'`),

      // Total products / crackers quantity sold
      db.select({ total: sql<number>`COALESCE(SUM(quantity), 0)` })
        .from(orderItems),

      // Today's order count
      db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(gte(orders.placedAt, today)),

      // Today's sales total
      db.select({ total: sql<string>`COALESCE(SUM(total_amount::numeric), 0)` })
        .from(orders)
        .where(and(gte(orders.placedAt, today), sql`${orders.orderStatus} != 'CANCELLED'`)),

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

    const totalOrders = Number(allOrdersCountResult[0]?.count ?? 0);
    const totalRevenue = parseFloat(allTimeRevenueResult[0]?.total ?? '0') || 0;
    const totalProductsSold = Number(allProductsSoldResult[0]?.total ?? 0);
    const totalCustomers = Number(totalCustomersResult[0]?.count ?? 0);

    // Dynamic month labels for last 6 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = today.getMonth();
    const monthlyAnalytics = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), currentMonthIdx - i, 1);
      const mName = monthNames[d.getMonth()];
      // Real revenue for current month if active
      const isCurrentMonth = i === 0;
      monthlyAnalytics.push({
        month: mName,
        revenue: isCurrentMonth ? Math.round(totalRevenue) : 0,
        target: 25000,
      });
    }

    return Response.json({
      dashboard: {
        totalOrders,
        totalRevenue,
        todayOrders: Number(todayOrdersResult[0]?.count ?? 0),
        todaySales: Number(todaySalesResult[0]?.total ?? 0),
        newOrders: Number(newOrdersResult[0]?.count ?? 0),
        pendingOrders: Number(newOrdersResult[0]?.count ?? 0),
        confirmedOrders: Number(confirmedResult[0]?.count ?? 0),
        assignedOrders: Number(assignedResult[0]?.count ?? 0),
        outForDelivery: Number(outForDeliveryResult[0]?.count ?? 0),
        completedToday: Number(deliveredTodayResult[0]?.count ?? 0),
        deliveredToday: Number(deliveredTodayResult[0]?.count ?? 0),
        totalCustomers,
        activeDeliveryPartners: Number(activePartnersResult[0]?.count ?? 0),
        lowStockProducts: Number(lowStockResult[0]?.count ?? 0),
        totalProductsSold,
        monthlyAnalytics,
        trafficSources: [
          { name: 'Direct Store', percent: totalOrders > 0 ? 60 : 0, value: totalRevenue, color: '#4F75FF' },
          { name: 'WhatsApp Orders', percent: totalOrders > 0 ? 40 : 0, value: 0, color: '#93C5FD' },
        ],
        recentOrders,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return Response.json({ message: 'Failed to load dashboard' }, { status: 500 });
  }
}


// Native Astro APIRoute exports
export const GET = wrapHandler(_GET);
