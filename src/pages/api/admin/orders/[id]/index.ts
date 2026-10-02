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

    // If newStatus is provided, proceed with status transition
    if (body.newStatus) {
      const { newStatus, note } = body;
      const currentStatus = order.orderStatus as OrderStatus;
      const fulfillmentType = order.fulfillmentType as FulfillmentType;

      // Idempotent: If status is already current, return success
      if (currentStatus === newStatus) {
        return Response.json({ success: true, newStatus, message: 'Status already up to date' });
      }

      // Validate transition using state machine
      const error = validateTransition(currentStatus, newStatus as OrderStatus, fulfillmentType);
      if (error) {
        return Response.json({ message: error }, { status: 400 });
      }

      const now = new Date();

      // Build update object
      const updateData: Record<string, unknown> = {
        orderStatus: newStatus,
        updatedAt: now,
      };

      // Set timestamp fields
      const tsField = getStatusTimestampField(newStatus as OrderStatus);
      if (tsField) {
        updateData[tsField] = now;
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

      // Map status transition to WhatsApp notification type
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

      return Response.json({ success: true, newStatus });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error updating order:', error);
    return Response.json({ message: 'Failed to update order' }, { status: 500 });
  }
}


// Native Astro APIRoute exports
export const GET = wrapHandler(_GET);
export const PATCH = wrapHandler(_PATCH);
