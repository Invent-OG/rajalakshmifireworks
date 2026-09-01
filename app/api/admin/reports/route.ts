import { NextRequest } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { and, gte, lte } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const range = searchParams.get('range') || '30days'; // 'today' | '7days' | '30days' | 'custom'
  const customStart = searchParams.get('start');
  const customEnd = searchParams.get('end');

  try {
    let startDate = new Date();
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    if (range === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === '7days') {
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === '30days') {
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === 'custom' && customStart) {
      startDate = new Date(customStart);
      startDate.setHours(0, 0, 0, 0);
      if (customEnd) {
        endDate.setTime(new Date(customEnd).getTime());
        endDate.setHours(23, 59, 59, 999);
      }
    }

    const whereTime = and(
      gte(orders.placedAt, startDate),
      lte(orders.placedAt, endDate)
    );

    // 1. Fetch matching orders
    const matchingOrders = await db.query.orders.findMany({
      where: whereTime,
      with: {
        items: true,
      },
      orderBy: [orders.placedAt],
    });

    const totalOrdersCount = matchingOrders.length;
    const completedOrders = matchingOrders.filter((o) => o.orderStatus === 'COMPLETED');
    const cancelledOrders = matchingOrders.filter((o) => o.orderStatus === 'CANCELLED');
    const deliveryOrders = matchingOrders.filter((o) => o.fulfillmentType === 'DELIVERY');
    const pickupOrders = matchingOrders.filter((o) => o.fulfillmentType === 'PICKUP');

    const totalGrossRevenue = matchingOrders
      .filter((o) => o.orderStatus !== 'CANCELLED')
      .reduce((sum, o) => sum + parseFloat(o.totalAmount || '0'), 0);

    const averageOrderValue =
      matchingOrders.length > 0 ? totalGrossRevenue / (matchingOrders.length - cancelledOrders.length || 1) : 0;

    // 2. Best selling products calculation from order items
    const productSalesMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    for (const order of matchingOrders) {
      if (order.orderStatus === 'CANCELLED') continue;
      for (const item of order.items) {
        const existing = productSalesMap.get(item.productNameSnapshot) || {
          name: item.productNameSnapshot,
          quantity: 0,
          revenue: 0,
        };
        existing.quantity += item.quantity;
        existing.revenue += parseFloat(item.lineTotal || '0');
        productSalesMap.set(item.productNameSnapshot, existing);
      }
    }

    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // 3. Daily Sales aggregation
    const salesByDayMap = new Map<string, { date: string; sales: number; count: number }>();
    for (const order of matchingOrders) {
      if (order.orderStatus === 'CANCELLED') continue;
      const dateKey = new Date(order.placedAt).toISOString().split('T')[0];
      const curr = salesByDayMap.get(dateKey) || { date: dateKey, sales: 0, count: 0 };
      curr.sales += parseFloat(order.totalAmount || '0');
      curr.count += 1;
      salesByDayMap.set(dateKey, curr);
    }

    const salesByDay = Array.from(salesByDayMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return Response.json({
      summary: {
        totalRevenue: totalGrossRevenue,
        totalOrders: totalOrdersCount,
        completedOrdersCount: completedOrders.length,
        cancelledOrdersCount: cancelledOrders.length,
        deliveryOrdersCount: deliveryOrders.length,
        pickupOrdersCount: pickupOrders.length,
        averageOrderValue,
      },
      topProducts,
      salesByDay,
    });
  } catch (error) {
    console.error('Error calculating reports:', error);
    return Response.json({ message: 'Failed to generate report' }, { status: 500 });
  }
}
