import { NextRequest } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq, and, gte, lte, sql, desc, asc } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '25', 10)));
    const offset = (page - 1) * limit;
    const status = searchParams.get('status');
    const fulfillment = searchParams.get('fulfillment');
    const search = searchParams.get('search')?.trim();
    const datePreset = searchParams.get('datePreset');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'placedAt_desc';

    const conditions = [];

    if (status && status !== 'ALL') {
      conditions.push(eq(orders.orderStatus, status));
    }
    if (fulfillment && fulfillment !== 'ALL') {
      conditions.push(eq(orders.fulfillmentType, fulfillment));
    }
    if (search) {
      conditions.push(
        sql`(
          ${orders.invoiceNumber} ILIKE ${`%${search}%`} OR
          ${orders.customerNameSnapshot} ILIKE ${`%${search}%`} OR
          ${orders.customerMobileSnapshot} ILIKE ${`%${search}%`} OR
          ${orders.notes} ILIKE ${`%${search}%`}
        )`
      );
    }

    // Handle date preset or custom range
    const now = new Date();
    if (datePreset === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      conditions.push(gte(orders.placedAt, startOfDay));
    } else if (datePreset === 'yesterday') {
      const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      conditions.push(gte(orders.placedAt, startOfYesterday));
      conditions.push(lte(orders.placedAt, endOfYesterday));
    } else if (datePreset === 'last7days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      conditions.push(gte(orders.placedAt, sevenDaysAgo));
    } else if (datePreset === 'thisMonth') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      conditions.push(gte(orders.placedAt, startOfMonth));
    } else {
      if (dateFrom) {
        conditions.push(gte(orders.placedAt, new Date(dateFrom)));
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        conditions.push(lte(orders.placedAt, endDate));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sorting
    let orderClause = [desc(orders.placedAt)];
    switch (sortBy) {
      case 'placedAt_asc':
        orderClause = [asc(orders.placedAt)];
        break;
      case 'total_desc':
        orderClause = [sql`CAST(${orders.totalAmount} AS NUMERIC) DESC`];
        break;
      case 'total_asc':
        orderClause = [sql`CAST(${orders.totalAmount} AS NUMERIC) ASC`];
        break;
      case 'invoice_asc':
        orderClause = [asc(orders.invoiceNumber)];
        break;
      case 'invoice_desc':
        orderClause = [desc(orders.invoiceNumber)];
        break;
      default:
        orderClause = [desc(orders.placedAt)];
    }

    // Execute queries in parallel: paginated orders, total filtered count, status counts summary
    const [orderList, countResult, statusGroupCounts] = await Promise.all([
      db.query.orders.findMany({
        where: whereClause,
        with: {
          items: true,
          customer: true,
        },
        orderBy: orderClause,
        limit,
        offset,
      }),
      db.select({ count: sql<number>`count(*)` }).from(orders).where(whereClause),
      db
        .select({
          status: orders.orderStatus,
          count: sql<number>`count(*)`,
        })
        .from(orders)
        .groupBy(orders.orderStatus),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    const statusCounts: Record<string, number> = {
      ALL: 0,
      PENDING: 0,
      CONFIRMED: 0,
      PROCESSING: 0,
      READY: 0,
      READY_FOR_PICKUP: 0,
      OUT_FOR_DELIVERY: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    let grandTotalOrders = 0;
    for (const row of statusGroupCounts) {
      const cnt = Number(row.count);
      statusCounts[row.status] = cnt;
      grandTotalOrders += cnt;
    }
    statusCounts.ALL = grandTotalOrders;

    return Response.json({
      orders: orderList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      statusCounts,
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return Response.json({ message: 'Failed to load orders' }, { status: 500 });
  }
}
