import { wrapHandler } from '@/src/lib/astro-api';
import { getSession } from '@/lib/auth/session';
import { getAgentLeaderboard } from '@/lib/services/agent-service';

async function _GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = request.nextUrl;
    const rankBy = (searchParams.get('rankBy') || 'delivered_value') as any;
    const datePreset = searchParams.get('datePreset') || 'all';
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;

    const leaderboard = await getAgentLeaderboard({
      rankBy,
      datePreset,
      dateFrom,
      dateTo,
    });

    return Response.json({ leaderboard });
  } catch (error: any) {
    return Response.json({ message: error.message || 'Failed to fetch agent reports' }, { status: 500 });
  }
}

export const GET = wrapHandler(_GET);
