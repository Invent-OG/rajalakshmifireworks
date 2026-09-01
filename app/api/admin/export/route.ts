import { NextRequest } from 'next/server';
import { db } from '@/db';
import { orders, products, customers } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import {
  generateOrdersCSV,
  generateProductsCSV,
  generateCustomersCSV,
} from '@/lib/services/export-service';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const type = searchParams.get('type') || 'orders'; // 'orders' | 'products' | 'customers'

  try {
    if (type === 'orders') {
      const orderList = await db.query.orders.findMany({
        with: { items: true },
        orderBy: [desc(orders.placedAt)],
      });

      const rows = orderList.map((o) => {
        const addr = o.addressSnapshot as { address?: string; city?: string; pincode?: string } | null;
        const addressStr = addr ? `${addr.address || ''}, ${addr.city || ''} - ${addr.pincode || ''}` : 'Shop Pickup';
        const itemsStr = o.items
          .map((i) => `${i.productNameSnapshot} (Qty: ${i.quantity})`)
          .join('; ');

        return {
          invoiceNumber: o.invoiceNumber,
          customerName: o.customerNameSnapshot,
          customerMobile: o.customerMobileSnapshot,
          orderStatus: o.orderStatus,
          fulfillmentType: o.fulfillmentType,
          subtotal: o.subtotal,
          discountAmount: o.discountAmount,
          deliveryCharge: o.deliveryCharge,
          totalAmount: o.totalAmount,
          itemsSummary: itemsStr,
          placedAt: new Date(o.placedAt).toISOString(),
          deliveryAddress: addressStr,
        };
      });

      const csv = generateOrdersCSV(rows);
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="orders-${Date.now()}.csv"`,
        },
      });
    }

    if (type === 'products') {
      const productList = await db.query.products.findMany({
        with: { category: true },
        orderBy: [products.name],
      });

      const rows = productList.map((p) => ({
        name: p.name,
        category: p.category?.name || 'Uncategorized',
        sku: p.sku,
        mrp: p.mrp,
        sellingPrice: p.sellingPrice,
        stockQuantity: p.stockQuantity,
        isActive: p.isActive,
      }));

      const csv = generateProductsCSV(rows);
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="products-${Date.now()}.csv"`,
        },
      });
    }

    if (type === 'customers') {
      const customerList = await db.query.customers.findMany({
        with: { orders: true },
        orderBy: [desc(customers.createdAt)],
      });

      const rows = customerList.map((c) => {
        const totalSpent = c.orders
          .filter((o) => o.orderStatus !== 'CANCELLED')
          .reduce((sum, o) => sum + parseFloat(o.totalAmount || '0'), 0);

        return {
          name: c.name,
          mobile: c.mobile,
          email: c.email,
          totalOrders: c.orders.length,
          totalSpent: totalSpent.toFixed(2),
          createdAt: new Date(c.createdAt).toISOString(),
        };
      });

      const csv = generateCustomersCSV(rows);
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="customers-${Date.now()}.csv"`,
        },
      });
    }

    return Response.json({ message: 'Invalid export type' }, { status: 400 });
  } catch (error) {
    console.error('Error exporting data:', error);
    return Response.json({ message: 'Export failed' }, { status: 500 });
  }
}
