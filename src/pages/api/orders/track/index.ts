import { wrapHandler } from '@/src/lib/astro-api';

import { db } from '@/db';
import { orders, orderStatusHistory } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { orderTrackingSchema } from '@/lib/validation/order';

async function _POST(request: NextRequest) {
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

    // Don't expose internal IDs or sensitive full address without invoice verification
    const safeOrders = orderList.map((order) => {
      const address = (order.addressSnapshot as Record<string, any>) || {};
      const isVerifiedWithInvoice = Boolean(invoiceNumber && invoiceNumber.trim().toUpperCase() === order.invoiceNumber.toUpperCase());
      
      // Protect customer privacy against mobile-only scanning:
      // If invoice number is not provided, only expose city/state, not complete street address
      const safeAddress = isVerifiedWithInvoice
        ? order.addressSnapshot
        : {
            city: address.city || address.deliveryCityName || '',
            state: address.state || address.deliveryStateName || '',
            pincode: address.pincode ? `${String(address.pincode).slice(0, 3)}***` : '',
          };

      return {
        invoiceNumber: order.invoiceNumber,
        orderStatus: order.orderStatus,
        fulfillmentType: order.fulfillmentType,
        subtotal: order.subtotal,
        discountAmount: order.discountAmount,
        deliveryCharge: order.deliveryCharge,
        totalAmount: order.totalAmount,
        customerName: isVerifiedWithInvoice
          ? order.customerNameSnapshot
          : order.customerNameSnapshot.slice(0, 2) + '***',
        address: safeAddress,
        placedAt: order.placedAt,
        confirmedAt: order.confirmedAt,
        packedAt: order.packedAt,
        dispatchedAt: order.dispatchedAt,
        readyForPickupAt: order.readyForPickupAt,
        pickedUpAt: order.pickedUpAt,
        deliveredAt: order.deliveredAt,
        completedAt: order.completedAt,
        lrNumber: order.lrNumber,
        carriageDetails: order.carriageDetails,
        lrCopyUrl: order.lrCopyUrl,
        packageCount: order.packageCount || 1,
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
      };
    });

    return Response.json({ orders: safeOrders });
  } catch (error) {
    console.error('Error tracking order:', error);
    return Response.json(
      { message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}


// Native Astro APIRoute exports
export const POST = wrapHandler(_POST);
