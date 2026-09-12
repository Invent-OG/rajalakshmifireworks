import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionFromToken } from '@/lib/auth/session';
import { DEFAULT_LOCALE, isValidLocale } from './lib/i18n/config';

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Protect admin routes (except login)
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

  // 2. Protect admin API routes (except auth routes)
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

  // 3. Skip static assets, Next internals, api, admin for i18n routing
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap.xml') ||
    pathname.includes('.') // static files (.png, .jpg, .svg, etc)
  ) {
    return NextResponse.next();
  }

  // 4. Check if pathname starts with a supported locale
  const pathnameLocale = pathname.split('/')[1];
  if (isValidLocale(pathnameLocale)) {
    const response = NextResponse.next();
    response.headers.set('x-locale', pathnameLocale);
    return response;
  }

  // 5. Resolve preferred locale from cookie
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  const targetLocale = cookieLocale && isValidLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  // 6. Redirect to locale prefixed path
  const targetPath = `/${targetLocale}${pathname === '/' ? '' : pathname}`;
  const redirectUrl = new URL(`${targetPath}${search}`, request.url);

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set('NEXT_LOCALE', targetLocale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files:
     */
    '/((?!_next/static|_next/image|images|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
