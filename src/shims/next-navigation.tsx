import { useState, useEffect, useCallback } from 'react';

export function useRouter() {
  const push = useCallback((url: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = url;
    }
  }, []);

  const replace = useCallback((url: string) => {
    if (typeof window !== 'undefined') {
      window.location.replace(url);
    }
  }, []);

  const back = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  }, []);

  const forward = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.history.forward();
    }
  }, []);

  const refresh = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, []);

  return {
    push,
    replace,
    back,
    forward,
    refresh,
    prefetch: () => {},
  };
}

export function usePathname() {
  const [pathname, setPathname] = useState(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setPathname(window.location.pathname);
    const onLocationChange = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onLocationChange);
    return () => window.removeEventListener('popstate', onLocationChange);
  }, []);

  return pathname;
}

export function useSearchParams() {
  const [params, setParams] = useState(
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams()
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setParams(new URLSearchParams(window.location.search));
    const onLocationChange = () => setParams(new URLSearchParams(window.location.search));
    window.addEventListener('popstate', onLocationChange);
    return () => window.removeEventListener('popstate', onLocationChange);
  }, []);

  return params;
}

export function useParams<T extends Record<string, string | string[]> = Record<string, string>>(): T {
  if (typeof window === 'undefined') return {} as T;
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  return { id: pathParts[pathParts.length - 1], slug: pathParts[pathParts.length - 1] } as unknown as T;
}

export function notFound() {
  if (typeof window !== 'undefined') {
    window.location.href = '/404';
  }
  throw new Error('NEXT_NOT_FOUND');
}

export function redirect(url: string) {
  if (typeof window !== 'undefined') {
    window.location.href = url;
  }
}
