import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionFromToken } from '@/lib/auth/session';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect admin routes (except login)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('admin_session')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const session = await getSessionFromToken(token);
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Protect admin API routes (except auth routes)
  if (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/auth')) {
    const token = request.cookies.get('admin_session')?.value;

    if (!token) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSessionFromToken(token);
    if (!session) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
