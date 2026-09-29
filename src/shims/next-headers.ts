import { AsyncLocalStorage } from 'node:async_hooks';

export interface CookieStoreLike {
  get: (name: string) => { value: string } | undefined;
  set: (name: string, value: string, options?: any) => void;
  delete: (name: string, options?: any) => void;
  has: (name: string) => boolean;
}

export const cookieStorage = new AsyncLocalStorage<CookieStoreLike>();

export async function cookies(): Promise<CookieStoreLike> {
  const store = cookieStorage.getStore();
  if (store) return store;

  // Fallback for client side or when store not available
  return {
    get: (name: string) => {
      if (typeof document !== 'undefined') {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? { value: decodeURIComponent(match[2]) } : undefined;
      }
      return undefined;
    },
    set: (name: string, value: string, options?: any) => {
      if (typeof document !== 'undefined') {
        document.cookie = `${name}=${encodeURIComponent(value)}; path=/`;
      }
    },
    delete: (name: string) => {
      if (typeof document !== 'undefined') {
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }
    },
    has: (name: string) => {
      if (typeof document !== 'undefined') {
        return document.cookie.indexOf(`${name}=`) !== -1;
      }
      return false;
    },
  };
}

export async function headers(): Promise<Headers> {
  return new Headers();
}
