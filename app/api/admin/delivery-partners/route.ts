import { NextRequest } from 'next/server';
import { db } from '@/db';
import { deliveryPartners } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { deliveryPartnerSchema } from '@/lib/validation/delivery-partner';
import { toErrorResponse } from '@/lib/utils/errors';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || searchParams.get('search')?.trim();
    const status = searchParams.get('status'); // 'ALL' | 'ACTIVE' | 'INACTIVE'

    const rows = await db.query.deliveryPartners.findMany({
      where: (dp, { and, eq }) => {
        const conditions = [];
        if (status === 'ACTIVE') conditions.push(eq(dp.status, 'ACTIVE'));
        if (status === 'INACTIVE') conditions.push(eq(dp.status, 'INACTIVE'));
        return conditions.length ? and(...conditions) : undefined;
      },
      orderBy: [desc(deliveryPartners.createdAt)],
    });

    let filtered = rows;
    if (query) {
      const qLower = query.toLowerCase();
      filtered = rows.filter((dp) => {
        return (
          dp.name.toLowerCase().includes(qLower) ||
          dp.mobileNumber.includes(qLower) ||
          (dp.vehicleType && dp.vehicleType.toLowerCase().includes(qLower)) ||
          (dp.vehicleNumber && dp.vehicleNumber.toLowerCase().includes(qLower)) ||
          (dp.email && dp.email.toLowerCase().includes(qLower))
        );
      });
    }

    const transformed = filtered.map((dp) => ({
      ...dp,
      fullName: dp.name,
    }));

    return Response.json(transformed);
  } catch (error) {
    const { message, statusCode } = toErrorResponse(error);
    return Response.json({ message }, { status: statusCode });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const result = deliveryPartnerSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { message: 'Validation failed', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const partnerName = (result.data.name || result.data.fullName || '').trim();

    // Check duplicate mobile number
    const existing = await db.query.deliveryPartners.findFirst({
      where: eq(deliveryPartners.mobileNumber, result.data.mobileNumber),
    });

    if (existing) {
      return Response.json(
        { message: `Delivery partner with mobile number ${result.data.mobileNumber} already exists` },
        { status: 409 }
      );
    }

    // Insert delivery partner
    const [created] = await db
      .insert(deliveryPartners)
      .values({
        name: partnerName,
        mobileNumber: result.data.mobileNumber,
        email: result.data.email || null,
        address: result.data.address || null,
        pincode: result.data.pincode || null,
        vehicleType: result.data.vehicleType || null,
        vehicleNumber: result.data.vehicleNumber || null,
        notes: result.data.notes || null,
        status: result.data.status,
      })
      .returning();

    return Response.json(
      {
        ...created,
        fullName: created.name,
      },
      { status: 201 }
    );
  } catch (error) {
    const { message, statusCode } = toErrorResponse(error);
    return Response.json({ message }, { status: statusCode });
  }
}
