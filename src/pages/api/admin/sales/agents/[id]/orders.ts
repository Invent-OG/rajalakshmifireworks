import { wrapHandler, type NextRequest } from '@/src/lib/astro-api';
import { getSession } from '@/lib/auth/session';
import { getAgentOrders } from '@/lib/services/agent-service';

async function _GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) return Response.json({ message: 'Invalid agent ID' }, { status: 400 });

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;
    const sortBy = searchParams.get('sortBy') || 'placedAt_desc';

    const result = await getAgentOrders(id, {
      page,
      limit,
      status,
      search,
      dateFrom,
      dateTo,
      sortBy,
    });

    return Response.json(result);
  } catch (error: any) {
    return Response.json({ message: error.message || 'Failed to fetch agent orders' }, { status: 500 });
  }
}

export const GET = wrapHandler(_GET);
