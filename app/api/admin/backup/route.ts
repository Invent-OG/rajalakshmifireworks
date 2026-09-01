import { db } from '@/db';
import { categories, products, orders, orderItems, customers, settings } from '@/db/schema';
import { getSession } from '@/lib/auth/session';

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const [allCategories, allProducts, allOrders, allOrderItems, allCustomers, allSettings] =
      await Promise.all([
        db.select().from(categories),
        db.select().from(products),
        db.select().from(orders),
        db.select().from(orderItems),
        db.select().from(customers),
        db.select().from(settings),
      ]);

    const backupPayload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      exportedBy: session.email,
      data: {
        categories: allCategories,
        products: allProducts,
        orders: allOrders,
        orderItems: allOrderItems,
        customers: allCustomers,
        settings: allSettings,
      },
      counts: {
        categories: allCategories.length,
        products: allProducts.length,
        orders: allOrders.length,
        orderItems: allOrderItems.length,
        customers: allCustomers.length,
      },
    };

    return new Response(JSON.stringify(backupPayload, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="backup-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('Error generating backup:', error);
    return Response.json({ message: 'Backup generation failed' }, { status: 500 });
  }
}
