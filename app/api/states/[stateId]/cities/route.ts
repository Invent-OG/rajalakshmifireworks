import { NextRequest } from 'next/server';
import { db } from '@/db';
import { cities, states } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { toErrorResponse } from '@/lib/utils/errors';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stateId: string }> }
) {
  try {
    const { stateId } = await params;
    const sId = parseInt(stateId);

    if (isNaN(sId) || sId <= 0) {
      return Response.json({ message: 'Invalid state ID' }, { status: 400 });
    }

    // Verify state exists and is active
    const state = await db.query.states.findFirst({
      where: and(eq(states.id, sId), eq(states.isActive, true)),
    });

    if (!state) {
      return Response.json({ message: 'State not found or inactive' }, { status: 404 });
    }

    const list = await db
      .select({
        id: cities.id,
        name: cities.name,
        stateId: cities.stateId,
      })
      .from(cities)
      .where(and(eq(cities.stateId, sId), eq(cities.isActive, true)))
      .orderBy(asc(cities.name));

    return Response.json(list, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    const { message, statusCode } = toErrorResponse(error);
    return Response.json({ message }, { status: statusCode });
  }
}
