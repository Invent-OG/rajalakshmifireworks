import { wrapHandler, type NextRequest } from '@/src/lib/astro-api';
import { getSession } from '@/lib/auth/session';
import { getAgentById, updateAgent } from '@/lib/services/agent-service';
import { updateAgentSchema } from '@/lib/validation/agent';

async function _GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) return Response.json({ message: 'Invalid agent ID' }, { status: 400 });

    const agent = await getAgentById(id);
    if (!agent) return Response.json({ message: 'Agent not found' }, { status: 404 });

    return Response.json({ agent });
  } catch (error: any) {
    return Response.json({ message: error.message || 'Failed to fetch agent' }, { status: 500 });
  }
}

async function _PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) return Response.json({ message: 'Invalid agent ID' }, { status: 400 });

    const body = await request.json();
    const parsed = updateAgentSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { message: 'Validation failed', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await updateAgent(id, parsed.data);
    return Response.json({ message: 'Agent updated successfully', agent: updated });
  } catch (error: any) {
    return Response.json({ message: error.message || 'Failed to update agent' }, { status: 400 });
  }
}

async function _PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return _PUT(request, context);
}

export const GET = wrapHandler(_GET);
export const PUT = wrapHandler(_PUT);
export const PATCH = wrapHandler(_PATCH);
