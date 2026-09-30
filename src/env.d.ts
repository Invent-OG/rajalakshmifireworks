/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare global {
  type NextRequest = Request & {
    nextUrl: URL;
    cookies: {
      get: (name: string) => { value: string } | undefined;
      set: (name: string, value: string, options?: any) => void;
      delete: (name: string, options?: any) => void;
      has: (name: string) => boolean;
    };
  };
}

export {};
