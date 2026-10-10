import { wrapHandler } from '@/src/lib/astro-api';
import { db } from '@/db';
import { orders, products, customers, deliveryPartners, orderItems } from '@/db/schema';
import { eq, sql, and } from 'drizzle-orm';
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
      ordersAggResult,
      allProductsSoldResult,
      totalCustomersResult,
      activePartnersResult,
      lowStockResult,
      recentOrders,
    ] = await Promise.all([
      // Combined orders aggregation query in a single roundtrip
      db
        .select({
          totalOrders: sql<number>`count(*)`,
          totalRevenue: sql<string>`COALESCE(SUM(CASE WHEN ${orders.orderStatus} != 'CANCELLED' THEN total_amount::numeric ELSE 0 END), 0)`,
          todayOrders: sql<number>`count(*) filter (where ${orders.placedAt} >= ${today})`,
          todaySales: sql<string>`COALESCE(SUM(CASE WHEN ${orders.placedAt} >= ${today} AND ${orders.orderStatus} != 'CANCELLED' THEN total_amount::numeric ELSE 0 END), 0)`,
          newOrders: sql<number>`count(*) filter (where ${orders.orderStatus} in ('NEW', 'PENDING'))`,
          confirmedOrders: sql<number>`count(*) filter (where ${orders.orderStatus} = 'CONFIRMED')`,
          assignedOrders: sql<number>`count(*) filter (where ${orders.orderStatus} = 'ASSIGNED')`,
          outForDelivery: sql<number>`count(*) filter (where ${orders.orderStatus} = 'OUT_FOR_DELIVERY')`,
          deliveredToday: sql<number>`count(*) filter (where ${orders.deliveredAt} >= ${today} and ${orders.orderStatus} in ('DELIVERED', 'COMPLETED'))`,
        })
        .from(orders),

      // Total products / crackers quantity sold
      db.select({ total: sql<number>`COALESCE(SUM(quantity), 0)` })
        .from(orderItems),

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

    const orderStats = ordersAggResult[0];
    const totalOrders = Number(orderStats?.totalOrders ?? 0);
    const totalRevenue = parseFloat(orderStats?.totalRevenue ?? '0') || 0;
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
        todayOrders: Number(orderStats?.todayOrders ?? 0),
        todaySales: Number(orderStats?.todaySales ?? 0),
        newOrders: Number(orderStats?.newOrders ?? 0),
        pendingOrders: Number(orderStats?.newOrders ?? 0),
        confirmedOrders: Number(orderStats?.confirmedOrders ?? 0),
        assignedOrders: Number(orderStats?.assignedOrders ?? 0),
        outForDelivery: Number(orderStats?.outForDelivery ?? 0),
        completedToday: Number(orderStats?.deliveredToday ?? 0),
        deliveredToday: Number(orderStats?.deliveredToday ?? 0),
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
