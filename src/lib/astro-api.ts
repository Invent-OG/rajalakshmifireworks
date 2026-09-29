import type { APIContext, APIRoute } from 'astro';

export function wrapHandler(
  fn: (req: any, ctx: { params: Promise<any> }) => Promise<Response>
): APIRoute {
  return async (context: any) => {
    const isAstroContext = context && typeof context === 'object' && 'request' in context && 'url' in context;
    const req = (isAstroContext ? context.request : context) as any;
    const url = isAstroContext ? context.url : (req.nextUrl || new URL(req.url));
    req.nextUrl = url;

    const cookiesObj = isAstroContext && context.cookies ? context.cookies : null;
    req.cookies = {
      get: (name: string) => {
        const val = cookiesObj?.get(name)?.value;
        return val ? { value: val } : undefined;
      },
      set: (name: string, value: string, options?: any) => cookiesObj?.set(name, value, options),
      delete: (name: string, options?: any) => cookiesObj?.delete(name, options),
      has: (name: string) => cookiesObj?.has(name) ?? false,
    };

    const params = isAstroContext ? context.params : {};
    const paramsPromise = Promise.resolve(params || {});

    try {
      return await fn(req, { params: paramsPromise });
    } catch (err: any) {
      console.error(`API Route Error [${req?.method || 'UNKNOWN'} ${url?.pathname || ''}]:`, err);
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
