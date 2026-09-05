import { NextRequest } from 'next/server';
import { db } from '@/db';
import { orders, orderStatusHistory } from '@/db/schema';
import { inArray } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { validateTransition, getStatusTimestampField } from '@/lib/services/order-status-machine';
import { restoreInventoryForOrder } from '@/lib/services/order-service';
import { whatsAppService } from '@/lib/whatsapp/service';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';
import type { OrderStatus, FulfillmentType } from '@/db/schema';
import type { WhatsAppMessageType } from '@/lib/whatsapp/types';

const bulkOrderStatusSchema = z.object({
  orderIds: z.array(z.number().int().positive()).min(1, 'Please select at least one order'),
  newStatus: z.enum([
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'READY',
    'READY_FOR_PICKUP',
    'OUT_FOR_DELIVERY',
    'COMPLETED',
    'CANCELLED',
  ]),
  note: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = bulkOrderStatusSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { message: 'Validation failed', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { orderIds, newStatus, note } = parsed.data;

    // Fetch orders to validate transitions
    const orderList = await db.query.orders.findMany({
      where: inArray(orders.id, orderIds),
    });

    if (orderList.length === 0) {
      return Response.json({ message: 'No matching orders found' }, { status: 404 });
    }

    const updatedIds: number[] = [];
    const skippedIds: { id: number; reason: string }[] = [];

    // Map new status to WhatsApp notification type
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

    for (const order of orderList) {
      const currentStatus = order.orderStatus as OrderStatus;
      const fulfillmentType = order.fulfillmentType as FulfillmentType;

      if (currentStatus === newStatus) {
        skippedIds.push({ id: order.id, reason: 'Already in this status' });
        continue;
      }

      const transitionError = validateTransition(currentStatus, newStatus, fulfillmentType);
      if (transitionError) {
        skippedIds.push({ id: order.id, reason: transitionError });
        continue;
      }

      const updateData: Record<string, unknown> = {
        orderStatus: newStatus,
        updatedAt: new Date(),
      };

      const tsField = getStatusTimestampField(newStatus);
      if (tsField) {
        updateData[tsField] = new Date();
      }

      await db.transaction(async (tx) => {
        await tx.update(orders).set(updateData).where(inArray(orders.id, [order.id]));
        await tx.insert(orderStatusHistory).values({
          orderId: order.id,
          oldStatus: currentStatus,
          newStatus,
          changedBy: session.email,
          note: note || `Bulk status update by ${session.name || session.email}`,
        });
      });

      if (newStatus === 'CANCELLED') {
        await restoreInventoryForOrder(order.id, session.email);
      }

      if (notificationType) {
        whatsAppService.sendOrderNotification(order.id, notificationType).catch((err) => {
          logger.error('admin.orders.bulk', 'Background WhatsApp dispatch failed in bulk update', {
            orderId: order.id,
            error: (err as Error).message,
          });
        });
      }

      updatedIds.push(order.id);
    }

    logger.info('admin.orders.bulk', 'Bulk order status update completed', {
      totalRequested: orderIds.length,
      updatedCount: updatedIds.length,
      skippedCount: skippedIds.length,
      newStatus,
      adminEmail: session.email,
    });

    return Response.json({
      success: true,
      updatedCount: updatedIds.length,
      updatedIds,
      skippedIds,
    });
  } catch (error) {
    logger.error('admin.orders.bulk', 'Bulk order status update error', {
      error: (error as Error).message,
    });
    return Response.json(
      { message: (error as Error).message || 'Failed to process bulk status update' },
      { status: 500 }
    );
  }
}
