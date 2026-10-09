import { wrapHandler } from '@/src/lib/astro-api';
import { getSession } from '@/lib/auth/session';
import { getAgents, createAgent } from '@/lib/services/agent-service';
import { createAgentSchema } from '@/lib/validation/agent';

async function _GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const status = searchParams.get('status') || 'ALL';
    const search = searchParams.get('search') || undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt_desc';

    const result = await getAgents({
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
    return Response.json({ message: error.message || 'Failed to fetch agents' }, { status: 500 });
  }
}

async function _POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = createAgentSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { message: 'Validation failed', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const agent = await createAgent(parsed.data);
    return Response.json({ message: 'Agent created successfully', agent }, { status: 201 });
  } catch (error: any) {
    return Response.json({ message: error.message || 'Failed to create agent' }, { status: 400 });
  }
}

export const GET = wrapHandler(_GET);
export const POST = wrapHandler(_POST);
