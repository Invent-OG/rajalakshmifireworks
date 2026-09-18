import { NextRequest } from 'next/server';
import { db } from '@/db';
import { orders, deliveryPartners, orderDeliveryAssignments, orderStatusHistory } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { assignDeliverySchema } from '@/lib/validation/order';
import { logger } from '@/lib/utils/logger';

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

  try {
    const body = await request.json();
    const result = assignDeliverySchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { message: 'Validation failed', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { deliveryPartnerId, note } = result.data;

    // Fetch order
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      return Response.json({ message: 'Order not found' }, { status: 404 });
    }

    if (order.orderStatus === 'CANCELLED' || order.orderStatus === 'DELIVERED') {
      return Response.json(
        { message: `Cannot assign delivery to a ${order.orderStatus.toLowerCase()} order` },
        { status: 400 }
      );
    }

    // Verify delivery partner exists and is ACTIVE
    const partner = await db.query.deliveryPartners.findFirst({
      where: and(
        eq(deliveryPartners.id, deliveryPartnerId),
        eq(deliveryPartners.status, 'ACTIVE')
      ),
    });

    if (!partner) {
      return Response.json(
        { message: 'Selected delivery partner does not exist or is not active' },
        { status: 400 }
      );
    }

    const previousStatus = order.orderStatus;
    const previousPartnerId = order.deliveryPartnerId;
    const now = new Date();

    await db.transaction(async (tx) => {
      // 1. If previous assignment exists, mark unassigned / reassigned
      if (previousPartnerId) {
        await tx
          .update(orderDeliveryAssignments)
          .set({
            unassignedAt: now,
            status: 'REASSIGNED',
          })
          .where(
            and(
              eq(orderDeliveryAssignments.orderId, orderId),
              eq(orderDeliveryAssignments.status, 'ACTIVE')
            )
          );
      }

      // 2. Insert new assignment history record
      await tx.insert(orderDeliveryAssignments).values({
        orderId,
        deliveryPartnerId,
        assignedBy: session.email,
        assignedAt: now,
        status: 'ACTIVE',
      });

      // 3. Update order
      await tx
        .update(orders)
        .set({
          deliveryPartnerId,
          assignedAt: now,
          assignedBy: session.email,
          orderStatus: 'ASSIGNED',
          updatedAt: now,
        })
        .where(eq(orders.id, orderId));

      // 4. Record status history
      const historyNote = previousPartnerId
        ? `Reassigned to delivery partner: ${partner.name}${note ? ` (${note})` : ''}`
        : `Assigned to delivery partner: ${partner.name}${note ? ` (${note})` : ''}`;

      await tx.insert(orderStatusHistory).values({
        orderId,
        oldStatus: previousStatus,
        newStatus: 'ASSIGNED',
        changedBy: session.email,
        note: historyNote,
      });
    });

    logger.info('order.assign_delivery', 'Delivery partner assigned successfully', {
      orderId,
      deliveryPartnerId,
      partnerName: partner.name,
      assignedBy: session.email,
    });

    return Response.json({
      success: true,
      orderStatus: 'ASSIGNED',
      deliveryPartnerId,
      assignedAt: now,
      assignedBy: session.email,
      deliveryPartner: partner,
    });
  } catch (error) {
    console.error('Error assigning delivery partner:', error);
    return Response.json({ message: 'Failed to assign delivery partner' }, { status: 500 });
  }
}
