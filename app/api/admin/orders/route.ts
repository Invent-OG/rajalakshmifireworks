import { NextRequest } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '25'));
    const offset = (page - 1) * limit;
    const status = searchParams.get('status');
    const fulfillment = searchParams.get('fulfillment');
    const search = searchParams.get('search')?.trim();
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const conditions = [];

    if (status) {
      conditions.push(eq(orders.orderStatus, status));
    }
    if (fulfillment) {
      conditions.push(eq(orders.fulfillmentType, fulfillment));
    }
    if (search) {
      // Search by invoice number, customer name, or mobile
      conditions.push(
        sql`(
          ${orders.invoiceNumber} ILIKE ${`%${search}%`} OR
          ${orders.customerNameSnapshot} ILIKE ${`%${search}%`} OR
          ${orders.customerMobileSnapshot} ILIKE ${`%${search}%`}
        )`
      );
    }
    if (dateFrom) {
      conditions.push(gte(orders.placedAt, new Date(dateFrom)));
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      conditions.push(lte(orders.placedAt, endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [orderList, countResult] = await Promise.all([
      db.query.orders.findMany({
        where: whereClause,
        with: {
          items: true,
        },
        orderBy: [desc(orders.placedAt)],
        limit,
        offset,
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(whereClause),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return Response.json({
      orders: orderList,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return Response.json({ message: 'Failed to load orders' }, { status: 500 });
  }
}
