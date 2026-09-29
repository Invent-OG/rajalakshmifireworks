import type { APIRoute, APIContext } from 'astro';

export function createAstroEndpoint(handlers: {
  GET?: any;
  POST?: any;
  PUT?: any;
  DELETE?: any;
  PATCH?: any;
}): APIRoute {
  return async (context: APIContext) => {
    const method = context.request.method.toUpperCase();
    const handler = (handlers as any)[method];

    if (!handler) {
      return new Response(JSON.stringify({ message: `Method ${method} Not Allowed` }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const req = context.request as any;
    req.nextUrl = new URL(context.request.url);
    req.cookies = {
      get: (name: string) => {
        const val = context.cookies.get(name)?.value;
        return val ? { value: val } : undefined;
      },
      set: (name: string, value: string, options?: any) => {
        context.cookies.set(name, value, {
          path: options?.path ?? '/',
          httpOnly: options?.httpOnly ?? true,
          secure: options?.secure ?? (process.env.NODE_ENV === 'production'),
          sameSite: options?.sameSite ?? 'lax',
          maxAge: options?.maxAge,
        });
      },
      delete: (name: string, options?: any) => {
        context.cookies.delete(name, { path: options?.path ?? '/' });
      },
      has: (name: string) => context.cookies.has(name),
    };

    const paramsPromise = Promise.resolve(context.params || {});

    try {
      const response = await handler(req, { params: paramsPromise });
      return response;
    } catch (err: any) {
      console.error(`API Route Error [${method} ${context.url.pathname}]:`, err);
      return new Response(
        JSON.stringify({
          message: err?.message || 'Internal Server Error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  };
}
