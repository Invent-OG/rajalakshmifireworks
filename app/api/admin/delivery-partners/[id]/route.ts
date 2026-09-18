import { NextRequest } from 'next/server';
import { db } from '@/db';
import { deliveryPartners, orders, orderDeliveryAssignments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { toErrorResponse } from '@/lib/utils/errors';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const partnerId = parseInt(id, 10);

    const partner = await db.query.deliveryPartners.findFirst({
      where: eq(deliveryPartners.id, partnerId),
    });

    if (!partner) {
      return Response.json({ message: 'Delivery partner not found' }, { status: 404 });
    }

    return Response.json({
      ...partner,
      fullName: partner.name,
    });
  } catch (error) {
    const { message, statusCode } = toErrorResponse(error);
    return Response.json({ message }, { status: statusCode });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const partnerId = parseInt(id, 10);
    const body = await request.json();

    const existing = await db.query.deliveryPartners.findFirst({
      where: eq(deliveryPartners.id, partnerId),
    });

    if (!existing) {
      return Response.json({ message: 'Delivery partner not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.name || body.fullName) updateData.name = (body.name || body.fullName).trim();
    if (body.mobileNumber) updateData.mobileNumber = body.mobileNumber.trim();
    if ('email' in body) updateData.email = body.email ? body.email.trim() : null;
    if ('address' in body) updateData.address = body.address ? body.address.trim() : null;
    if ('pincode' in body) updateData.pincode = body.pincode ? body.pincode.trim() : null;
    if ('vehicleType' in body) updateData.vehicleType = body.vehicleType ? body.vehicleType.trim() : null;
    if ('vehicleNumber' in body) updateData.vehicleNumber = body.vehicleNumber ? body.vehicleNumber.trim() : null;
    if ('notes' in body) updateData.notes = body.notes ? body.notes.trim() : null;
    if ('status' in body) updateData.status = body.status;

    const [updated] = await db
      .update(deliveryPartners)
      .set(updateData)
      .where(eq(deliveryPartners.id, partnerId))
      .returning();

    return Response.json({
      ...updated,
      fullName: updated.name,
    });
  } catch (error) {
    const { message, statusCode } = toErrorResponse(error);
    return Response.json({ message }, { status: statusCode });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const partnerId = parseInt(id, 10);

    const partner = await db.query.deliveryPartners.findFirst({
      where: eq(deliveryPartners.id, partnerId),
    });

    if (!partner) {
      return Response.json({ message: 'Delivery partner not found' }, { status: 404 });
    }

    // Check if partner has associated orders or assignments
    const assignedOrders = await db.query.orders.findFirst({
      where: eq(orders.deliveryPartnerId, partnerId),
    });

    const hasAssignments = await db.query.orderDeliveryAssignments.findFirst({
      where: eq(orderDeliveryAssignments.deliveryPartnerId, partnerId),
    });

    if (assignedOrders || hasAssignments) {
      // Soft-deactivate to maintain order history
      await db
        .update(deliveryPartners)
        .set({ status: 'INACTIVE', updatedAt: new Date() })
        .where(eq(deliveryPartners.id, partnerId));

      return Response.json({
        message: 'Delivery partner has historical orders and was set to Inactive to preserve records.',
        softDeleted: true,
      });
    }

    // Hard delete safe
    await db.delete(deliveryPartners).where(eq(deliveryPartners.id, partnerId));

    return Response.json({ message: 'Delivery partner deleted successfully.' });
  } catch (error) {
    const { message, statusCode } = toErrorResponse(error);
    return Response.json({ message }, { status: statusCode });
  }
}
