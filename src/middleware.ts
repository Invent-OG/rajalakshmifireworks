import { defineMiddleware } from 'astro:middleware';
import { getSessionFromToken } from '@/lib/auth/session';
import { DEFAULT_LOCALE, isValidLocale } from '@/lib/i18n/config';
import { cookieStorage, type CookieStoreLike } from '@/src/shims/next-headers';

export const onRequest = defineMiddleware(async (context, next) => {
  const url = context.url;
  const pathname = url.pathname;
  const search = url.search;

  // 1. Create a cookie adapter for AsyncLocalStorage so getSession() and cookies() work everywhere
  const astroCookies = context.cookies;
  const cookieStore: CookieStoreLike = {
    get: (name: string) => {
      const c = astroCookies.get(name);
      return c?.value ? { value: c.value } : undefined;
    },
    set: (name: string, value: string, options?: any) => {
      astroCookies.set(name, value, {
        path: '/',
        httpOnly: options?.httpOnly ?? true,
        secure: options?.secure ?? (process.env.NODE_ENV === 'production'),
        sameSite: options?.sameSite ?? 'lax',
        maxAge: options?.maxAge,
      });
    },
    delete: (name: string, options?: any) => {
      astroCookies.delete(name, { path: options?.path ?? '/' });
    },
    has: (name: string) => {
      return astroCookies.has(name);
    },
  };

  return cookieStorage.run(cookieStore, async () => {
    // 2. Protect admin routes (except login)
    if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
      const token = astroCookies.get('admin_session')?.value;
      if (!token) {
        return context.redirect('/admin/login');
      }
      const session = await getSessionFromToken(token);
      if (!session) {
        return context.redirect('/admin/login');
      }
    }

    // 3. Protect admin API routes (except auth routes)
    if (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/auth')) {
      const token = astroCookies.get('admin_session')?.value;
      if (!token) {
        return new Response(JSON.stringify({ message: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const session = await getSessionFromToken(token);
      if (!session) {
        return new Response(JSON.stringify({ message: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // 4. Skip static assets, api, admin for i18n routing
    if (
      pathname.startsWith('/api') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/images') ||
      pathname.startsWith('/favicon.ico') ||
      pathname.startsWith('/robots.txt') ||
      pathname.startsWith('/sitemap.xml') ||
      pathname.includes('.')
    ) {
      return next();
    }

    // 5. Check if pathname starts with a supported locale
    const pathnameLocale = pathname.split('/')[1];
    if (isValidLocale(pathnameLocale)) {
      return next();
    }

    // 6. Resolve preferred locale from cookie
    const cookieLocale = astroCookies.get('NEXT_LOCALE')?.value;
    const targetLocale = cookieLocale && isValidLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

    // 7. Redirect to locale prefixed path
    const targetPath = `/${targetLocale}${pathname === '/' ? '' : pathname}`;
    astroCookies.set('NEXT_LOCALE', targetLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });

    return context.redirect(`${targetPath}${search}`);
  });
});
