import { NextRequest } from 'next/server';
import { db } from '@/db';
import { customers } from '@/db/schema';
import { sql, desc, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '25'));
  const offset = (page - 1) * limit;
  const search = searchParams.get('search')?.trim();

  try {
    const conditions = [];
    if (search) {
      conditions.push(
        sql`(${customers.name} ILIKE ${`%${search}%`} OR ${customers.mobile} ILIKE ${`%${search}%`})`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [customerList, countResult] = await Promise.all([
      db.query.customers.findMany({
        where: whereClause,
        with: {
          orders: {
            columns: { id: true, totalAmount: true, orderStatus: true, placedAt: true },
          },
        },
        orderBy: [desc(customers.createdAt)],
        limit,
        offset,
      }),
      db.select({ count: sql<number>`count(*)` }).from(customers).where(whereClause),
    ]);

    const formattedCustomers = customerList.map((c: { orders: any[]; id: any; name: any; mobile: any; email: any; createdAt: any; }) => {
      const totalSpent = c.orders
        .filter((o) => o.orderStatus !== 'CANCELLED')
        .reduce((sum, o) => sum + parseFloat(o.totalAmount || '0'), 0);

      const latestOrder = [...c.orders].sort(
        (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
      )[0];

      return {
        id: c.id,
        name: c.name,
        mobile: c.mobile,
        email: c.email,
        totalOrders: c.orders.length,
        totalSpent,
        lastOrderAt: latestOrder?.placedAt || null,
        createdAt: c.createdAt,
      };
    });

    const total = Number(countResult[0]?.count ?? 0);

    return Response.json({
      customers: formattedCustomers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return Response.json({ message: 'Failed to load customers' }, { status: 500 });
  }
}
