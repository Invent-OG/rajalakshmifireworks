import { NextRequest } from 'next/server';
import { db } from '@/db';
import { customers, orders } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const customerId = parseInt(id);

  try {
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, customerId),
      with: {
        addresses: true,
        orders: {
          with: {
            items: true,
          },
          orderBy: [desc(orders.placedAt)],
        },
      },
    });

    if (!customer) {
      return Response.json({ message: 'Customer not found' }, { status: 404 });
    }

    const totalSpent = customer.orders
      .filter((o) => o.orderStatus !== 'CANCELLED')
      .reduce((sum, o) => sum + parseFloat(o.totalAmount || '0'), 0);

    return Response.json({
      customer: {
        ...customer,
        totalSpent,
        totalOrders: customer.orders.length,
      },
    });
  } catch (error) {
    console.error('Error fetching customer detail:', error);
    return Response.json({ message: 'Failed to load customer' }, { status: 500 });
  }
}
