import { NextRequest } from 'next/server';
import { db } from '@/db';
import { orders, whatsappMessages } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { whatsAppService } from '@/lib/whatsapp/service';
import { logger } from '@/lib/utils/logger';
import type { WhatsAppMessageType } from '@/lib/whatsapp/types';

/**
 * POST /api/admin/orders/[id]/whatsapp/retry
 * Authenticated admin endpoint to manually retry or send a WhatsApp notification.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const orderId = parseInt(id, 10);

  if (isNaN(orderId)) {
    return Response.json({ message: 'Invalid order ID' }, { status: 400 });
  }

  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      return Response.json({ message: 'Order not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const messageId = body.messageId ? parseInt(body.messageId, 10) : undefined;
    const messageType = body.messageType as WhatsAppMessageType | undefined;

    let result;

    if (messageId) {
      // Retry specific message record
      result = await whatsAppService.retryNotification(messageId, session.email);
    } else if (messageType) {
      // Send/retry specific message type for this order
      result = await whatsAppService.sendOrderNotification(orderId, messageType, true);
    } else {
      // Find latest message for this order
      const latestMessage = await db.query.whatsappMessages.findFirst({
        where: eq(whatsappMessages.orderId, orderId),
        orderBy: [desc(whatsappMessages.createdAt)],
      });

      if (latestMessage) {
        result = await whatsAppService.retryNotification(latestMessage.id, session.email);
      } else {
        // Fallback: send Order Received notification
        result = await whatsAppService.sendOrderReceived(orderId);
      }
    }

    logger.info('admin.whatsapp.retry', 'Admin manual WhatsApp retry executed', {
      orderId,
      adminEmail: session.email,
      success: result.success,
      status: result.status,
    });

    return Response.json({
      success: result.success,
      notification: result,
    });
  } catch (error) {
    logger.error('admin.whatsapp.retry', 'Failed to retry WhatsApp notification', {
      orderId,
      error: (error as Error).message,
    });
    return Response.json(
      { message: (error as Error).message || 'Failed to retry WhatsApp notification' },
      { status: 500 }
    );
  }
}
