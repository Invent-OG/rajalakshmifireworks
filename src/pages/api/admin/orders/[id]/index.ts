import { wrapHandler, type NextRequest } from '@/src/lib/astro-api';

import { db } from '@/db';
import { orders, orderStatusHistory, orderDeliveryAssignments, whatsappMessages } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { validateTransition, getStatusTimestampField } from '@/lib/services/order-status-machine';
import { restoreInventoryForOrder } from '@/lib/services/order-service';
import { whatsAppService } from '@/lib/whatsapp/service';
import type { WhatsAppMessageType } from '@/lib/whatsapp/types';
import { logger } from '@/lib/utils/logger';
import type { OrderStatus, FulfillmentType } from '@/db/schema';

async function _GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const orderId = parseInt(id, 10);

  if (isNaN(orderId) || orderId <= 0) {
    return Response.json({ message: 'Invalid order ID' }, { status: 400 });
  }

  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        items: true,
        customer: true,
        state: true,
        city: true,
        deliveryPartner: true,
        deliveryAssignments: {
          orderBy: [desc(orderDeliveryAssignments.createdAt)],
          with: {
            deliveryPartner: true,
          },
        },
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

async function _PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const orderId = parseInt(id, 10);

  if (isNaN(orderId) || orderId <= 0) {
    return Response.json({ message: 'Invalid order ID' }, { status: 400 });
  }

  try {
    const body = await request.json();

    // Fetch current order
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      return Response.json({ message: 'Order not found' }, { status: 404 });
    }

    const now = new Date();
    const updateData: Record<string, unknown> = {
      updatedAt: now,
    };

    let statusChanged = false;
    let paymentChanged = false;
    const currentStatus = order.orderStatus as OrderStatus;
    const fulfillmentType = order.fulfillmentType as FulfillmentType;
    const newStatus = body.newStatus as OrderStatus | undefined;

    // Handle order status transition
    if (newStatus && newStatus !== currentStatus) {
      const error = validateTransition(currentStatus, newStatus, fulfillmentType);
      if (error) {
        return Response.json({ message: error }, { status: 400 });
      }

      updateData.orderStatus = newStatus;
      const tsField = getStatusTimestampField(newStatus);
      if (tsField) {
        updateData[tsField] = now;
      }
      statusChanged = true;
    }

    // Handle payment status update
    if (body.paymentStatus !== undefined && body.paymentStatus !== order.paymentStatus) {
      paymentChanged = true;
      updateData.paymentStatus = body.paymentStatus;

      if (body.paymentStatus === 'PAID') {
        updateData.paidAt = now;
        updateData.paidBy = session.email;
        updateData.paymentMethod = body.paymentMethod || order.paymentMethod || 'UPI';
        updateData.paymentReference = body.paymentReference !== undefined ? body.paymentReference : (order.paymentReference || null);
      } else if (body.paymentStatus === 'PENDING') {
        updateData.paidAt = null;
        updateData.paidBy = null;
        updateData.paymentReference = null;
      }
    } else {
      if (body.paymentMethod !== undefined) updateData.paymentMethod = body.paymentMethod;
      if (body.paymentReference !== undefined) updateData.paymentReference = body.paymentReference;
    }

    if (!statusChanged && !paymentChanged && Object.keys(updateData).length <= 1) {
      return Response.json({ success: true, message: 'No changes required' });
    }

    await db.transaction(async (tx) => {
      // Update order
      await tx
        .update(orders)
        .set(updateData)
        .where(eq(orders.id, orderId));

      // Record status change in history
      if (statusChanged && newStatus) {
        await tx.insert(orderStatusHistory).values({
          orderId,
          oldStatus: currentStatus,
          newStatus,
          changedBy: session.email,
          note: body.note || null,
        });
      }

      // Record payment status change in history
      if (paymentChanged) {
        const payMethod = updateData.paymentMethod || body.paymentMethod || 'UPI';
        const payRef = updateData.paymentReference || body.paymentReference;
        const paymentNote =
          body.paymentStatus === 'PAID'
            ? `Payment Recorded: Marked as PAID via ${payMethod}${payRef ? ` (Ref: ${payRef})` : ''}`
            : 'Payment status updated to PENDING';

        await tx.insert(orderStatusHistory).values({
          orderId,
          oldStatus: newStatus || currentStatus,
          newStatus: newStatus || currentStatus,
          changedBy: session.email,
          note: paymentNote,
        });
      }
    });

    // Restore inventory if cancelled
    if (statusChanged && newStatus === 'CANCELLED') {
      await restoreInventoryForOrder(orderId, session.email);
    }

    // Map status transition to WhatsApp notification type
    if (statusChanged && newStatus) {
      let notificationType: WhatsAppMessageType | null = null;
      switch (newStatus) {
        case 'CONFIRMED':
          notificationType = 'ORDER_CONFIRMED';
          break;
        case 'ASSIGNED':
          notificationType = 'ORDER_ASSIGNED';
          break;
        case 'OUT_FOR_DELIVERY':
          notificationType = 'ORDER_OUT_FOR_DELIVERY';
          break;
        case 'DELIVERED':
          notificationType = 'ORDER_DELIVERED';
          break;
        case 'CANCELLED':
          notificationType = 'ORDER_CANCELLED';
          break;
      }

      if (notificationType) {
        whatsAppService.sendOrderNotification(orderId, notificationType).catch((err) => {
          logger.error('admin.orders.status', 'Background WhatsApp dispatch failed on status update', {
            orderId,
            newStatus,
            error: (err as Error).message,
          });
        });
      }

      logger.info('order.status', 'Order status updated', {
        orderId,
        oldStatus: currentStatus,
        newStatus,
        changedBy: session.email,
      });
    }

    if (paymentChanged) {
      logger.info('order.payment', 'Order payment status updated', {
        orderId,
        paymentStatus: body.paymentStatus,
        changedBy: session.email,
      });
    }

    return Response.json({
      success: true,
      newStatus: newStatus || currentStatus,
      paymentStatus: (updateData.paymentStatus as string) || order.paymentStatus,
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return Response.json({ message: 'Failed to update order' }, { status: 500 });
  }
}


// Native Astro APIRoute exports
export const GET = wrapHandler(_GET);
export const PATCH = wrapHandler(_PATCH);
