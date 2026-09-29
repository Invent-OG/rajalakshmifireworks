import { wrapHandler } from '@/src/lib/astro-api';

import { db } from '@/db';
import { states } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { toErrorResponse } from '@/lib/utils/errors';

export const dynamic = 'force-dynamic';

async function _GET(request: NextRequest) {
  try {
    const list = await db
      .select({
        id: states.id,
        name: states.name,
        code: states.code,
      })
      .from(states)
      .where(eq(states.isActive, true))
      .orderBy(asc(states.name));

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


// Native Astro APIRoute exports
export const GET = wrapHandler(_GET);
