import { getSession } from '@/lib/auth/session';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ message: 'Not authenticated' }, { status: 401 });
  }
  return Response.json({ user: session });
}
