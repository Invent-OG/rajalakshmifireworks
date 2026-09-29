import { wrapHandler } from '@/src/lib/astro-api';
import { getSession } from '@/lib/auth/session';

async function _GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ message: 'Not authenticated' }, { status: 401 });
  }
  return Response.json({ user: session });
}


// Native Astro APIRoute exports
export const GET = wrapHandler(_GET);
