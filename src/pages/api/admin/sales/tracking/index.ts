import { wrapHandler } from '@/src/lib/astro-api';
import { getSession } from '@/lib/auth/session';
import { getAgentTrackingDashboard } from '@/lib/services/agent-service';

async function _GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = request.nextUrl;
    const datePreset = searchParams.get('datePreset') || 'last30days';
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;

    const dashboard = await getAgentTrackingDashboard({
      datePreset,
      dateFrom,
      dateTo,
    });

    return Response.json(dashboard);
  } catch (error: any) {
    return Response.json({ message: error.message || 'Failed to fetch dashboard metrics' }, { status: 500 });
  }
}

export const GET = wrapHandler(_GET);
