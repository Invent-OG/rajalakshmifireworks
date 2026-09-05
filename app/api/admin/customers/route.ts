import { NextRequest } from 'next/server';
import { db } from '@/db';
import { customers } from '@/db/schema';
import { sql, desc, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';

interface CustomerOrderSummary {
  id: number;
  totalAmount: string | null;
  orderStatus: string;
  placedAt: Date | string;
}

interface RawCustomerRecord {
  id: number;
  name: string;
  mobile: string;
  email: string | null;
  createdAt: Date | string;
  orders: CustomerOrderSummary[];
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '25', 10)));
  const offset = (page - 1) * limit;
  const search = searchParams.get('search')?.trim();
  const segment = searchParams.get('segment') || 'all'; // 'all' | 'repeat' | 'vip'
  const sortBy = searchParams.get('sortBy') || 'spent_desc';

  try {
    const conditions = [];
    if (search) {
      conditions.push(
        sql`(${customers.name} ILIKE ${`%${search}%`} OR ${customers.mobile} ILIKE ${`%${search}%`} OR ${customers.email} ILIKE ${`%${search}%`})`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch all matching customers with order summaries to compute aggregate stats
    const rawCustomers = (await db.query.customers.findMany({
      where: whereClause,
      with: {
        orders: {
          columns: { id: true, totalAmount: true, orderStatus: true, placedAt: true },
        },
      },
      orderBy: [desc(customers.createdAt)],
    })) as RawCustomerRecord[];

    // Calculate computed lifetime values
    let formattedCustomers = rawCustomers.map((c) => {
      const validOrders = c.orders.filter((o) => o.orderStatus !== 'CANCELLED');
      const totalSpent = validOrders.reduce(
        (sum, o) => sum + parseFloat(o.totalAmount || '0'),
        0
      );

      const latestOrder = [...c.orders].sort(
        (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
      )[0];

      return {
        id: c.id,
        name: c.name,
        mobile: c.mobile,
        email: c.email,
        totalOrders: c.orders.length,
        validOrderCount: validOrders.length,
        totalSpent,
        lastOrderAt: latestOrder?.placedAt || null,
        createdAt: c.createdAt,
      };
    });

    // Segment filtering
    if (segment === 'repeat') {
      formattedCustomers = formattedCustomers.filter((c) => c.totalOrders >= 2);
    } else if (segment === 'vip') {
      formattedCustomers = formattedCustomers.filter((c) => c.totalSpent >= 5000);
    }

    // Segment sorting
    switch (sortBy) {
      case 'spent_desc':
        formattedCustomers.sort((a, b) => b.totalSpent - a.totalSpent);
        break;
      case 'spent_asc':
        formattedCustomers.sort((a, b) => a.totalSpent - b.totalSpent);
        break;
      case 'orders_desc':
        formattedCustomers.sort((a, b) => b.totalOrders - a.totalOrders);
        break;
      case 'recent_desc':
        formattedCustomers.sort(
          (a, b) =>
            new Date(b.lastOrderAt || 0).getTime() - new Date(a.lastOrderAt || 0).getTime()
        );
        break;
      case 'name_asc':
        formattedCustomers.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        formattedCustomers.sort((a, b) => b.totalSpent - a.totalSpent);
    }

    const total = formattedCustomers.length;
    const paginatedSlice = formattedCustomers.slice(offset, offset + limit);

    // High level customer KPI stats
    const totalCustomersCount = rawCustomers.length;
    const repeatBuyersCount = rawCustomers.filter((c) => c.orders.length >= 2).length;
    const vipBuyersCount = rawCustomers.filter((c) => {
      const spent = c.orders
        .filter((o) => o.orderStatus !== 'CANCELLED')
        .reduce((sum, o) => sum + parseFloat(o.totalAmount || '0'), 0);
      return spent >= 5000;
    }).length;

    return Response.json({
      customers: paginatedSlice,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats: {
        total: totalCustomersCount,
        repeat: repeatBuyersCount,
        vip: vipBuyersCount,
      },
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return Response.json({ message: 'Failed to load customers' }, { status: 500 });
  }
}
