export class NextResponse extends Response {
  static json(data: any, init?: ResponseInit) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });
  }

  static redirect(url: string | URL, status: number = 307) {
    return new Response(null, {
      status,
      headers: {
        Location: typeof url === 'string' ? url : url.toString(),
      },
    });
  }

  static next() {
    return new Response(null, { status: 200 });
  }
}

export type NextRequest = Request & {
  nextUrl: URL;
  cookies: {
    get: (name: string) => { value: string } | undefined;
    set: (name: string, value: string, options?: any) => void;
    delete: (name: string) => void;
  };
};
