import { NextRequest } from 'next/server';
import { db } from '@/db';
import { orders, orderStatusHistory, whatsappMessages } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { orderStatusUpdateSchema } from '@/lib/validation/order';
import { validateTransition, getStatusTimestampField } from '@/lib/services/order-status-machine';
import { restoreInventoryForOrder } from '@/lib/services/order-service';
import { whatsAppService } from '@/lib/whatsapp/service';
import { logger } from '@/lib/utils/logger';
import type { OrderStatus, FulfillmentType } from '@/db/schema';
import type { WhatsAppMessageType } from '@/lib/whatsapp/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const orderId = parseInt(id, 10);

  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        items: true,
        customer: true,
        statusHistory: {
          orderBy: [desc(orderStatusHistory.createdAt)],
        },
        whatsappMessages: {
          orderBy: [desc(whatsappMessages.createdAt)],
        },
      },
    });

    if (!order) {
      return Response.json({ message: 'Order not found' }, { status: 404 });
    }

    return Response.json({ order });
  } catch (error) {
    console.error('Error fetching order detail:', error);
    return Response.json({ message: 'Failed to load order' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const orderId = parseInt(id, 10);

  try {
    const body = await request.json();
    const result = orderStatusUpdateSchema.safeParse(body);

    if (!result.success) {
      return Response.json({ message: 'Invalid status' }, { status: 400 });
    }

    const { newStatus, note } = result.data;

    // Fetch current order
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      return Response.json({ message: 'Order not found' }, { status: 404 });
    }

    const currentStatus = order.orderStatus as OrderStatus;
    const fulfillmentType = order.fulfillmentType as FulfillmentType;

    // Idempotent: If status is already current, do not re-run status machine or send notifications
    if (currentStatus === newStatus) {
      return Response.json({ success: true, newStatus, message: 'Status already up to date' });
    }

    // Validate transition using state machine
    const error = validateTransition(currentStatus, newStatus, fulfillmentType);
    if (error) {
      return Response.json({ message: error }, { status: 400 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      orderStatus: newStatus,
      updatedAt: new Date(),
    };

    // Set timestamp fields
    const tsField = getStatusTimestampField(newStatus);
    if (tsField) {
      updateData[tsField] = new Date();
    }

    await db.transaction(async (tx) => {
      // Update order
      await tx
        .update(orders)
        .set(updateData)
        .where(eq(orders.id, orderId));

      // Record status history
      await tx.insert(orderStatusHistory).values({
        orderId,
        oldStatus: currentStatus,
        newStatus,
        changedBy: session.email,
        note: note || null,
      });
    });

    // Restore inventory if cancelled
    if (newStatus === 'CANCELLED') {
      await restoreInventoryForOrder(orderId, session.email);
    }

    logger.info('order.status', 'Order status updated', {
      orderId,
      oldStatus: currentStatus,
      newStatus,
      changedBy: session.email,
    });

    // Map order status to WhatsApp message type
    let notificationType: WhatsAppMessageType | null = null;
    switch (newStatus) {
      case 'CONFIRMED':
        notificationType = 'ORDER_CONFIRMED';
        break;
      case 'PROCESSING':
      case 'READY':
      case 'READY_FOR_PICKUP':
        notificationType = 'ORDER_PACKED';
        break;
      case 'OUT_FOR_DELIVERY':
        notificationType = 'ORDER_OUT_FOR_DELIVERY';
        break;
      case 'COMPLETED':
        notificationType = 'ORDER_DELIVERED';
        break;
      case 'CANCELLED':
        notificationType = 'ORDER_CANCELLED';
        break;
    }

    // Trigger WhatsApp notification asynchronously in background
    if (notificationType) {
      whatsAppService
        .sendOrderNotification(orderId, notificationType)
        .catch((err) => {
          logger.error('admin.orders.status', 'Background WhatsApp status dispatch failed', {
            orderId,
            notificationType,
            error: (err as Error).message,
          });
        });
    }

    return Response.json({ success: true, newStatus });
  } catch (error) {
    console.error('Error updating order status:', error);
    return Response.json({ message: 'Failed to update order status' }, { status: 500 });
  }
}

