import { NextRequest } from 'next/server';
import { db } from '@/db';
import { orders, orderStatusHistory } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { orderTrackingSchema } from '@/lib/validation/order';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = orderTrackingSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { message: 'Please enter a valid mobile number' },
        { status: 400 }
      );
    }

    const { mobile, invoiceNumber } = result.data;

    // Build query conditions
    const conditions = [eq(orders.customerMobileSnapshot, mobile)];

    if (invoiceNumber) {
      conditions.push(eq(orders.invoiceNumber, invoiceNumber));
    }

    const orderList = await db.query.orders.findMany({
      where: and(...conditions),
      with: {
        items: true,
        statusHistory: {
          orderBy: [desc(orderStatusHistory.createdAt)],
        },
      },
      orderBy: [desc(orders.placedAt)],
      limit: 20,
    });

    // Don't expose internal IDs
    const safeOrders = orderList.map((order) => ({
      invoiceNumber: order.invoiceNumber,
      orderStatus: order.orderStatus,
      fulfillmentType: order.fulfillmentType,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      deliveryCharge: order.deliveryCharge,
      totalAmount: order.totalAmount,
      customerName: order.customerNameSnapshot,
      address: order.addressSnapshot,
      placedAt: order.placedAt,
      confirmedAt: order.confirmedAt,
      completedAt: order.completedAt,
      items: order.items.map((item) => ({
        productName: item.productNameSnapshot,
        quantity: item.quantity,
        mrp: item.mrpSnapshot,
        sellingPrice: item.sellingPriceSnapshot,
        lineTotal: item.lineTotal,
      })),
      statusHistory: order.statusHistory.map((h) => ({
        status: h.newStatus,
        note: h.note,
        createdAt: h.createdAt,
      })),
    }));

    return Response.json({ orders: safeOrders });
  } catch (error) {
    console.error('Error tracking order:', error);
    return Response.json(
      { message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
