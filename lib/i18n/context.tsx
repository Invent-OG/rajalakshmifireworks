'use client';

import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Locale, DEFAULT_LOCALE, isValidLocale } from './config';
import enMessages from '@/messages/en.json';
import taMessages from '@/messages/ta.json';

type MessagesType = typeof enMessages;

const messagesMap: Record<Locale, MessagesType> = {
  en: enMessages,
  ta: taMessages as unknown as MessagesType,
};

interface I18nContextValue {
  locale: Locale;
  setLocale: (newLocale: Locale) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

function interpolate(text: string, values?: Record<string, string | number>): string {
  if (!values) return text;
  return text.replace(/\{(\w+)\}/g, (_, key) => {
    return values[key] !== undefined ? String(values[key]) : `{${key}}`;
  });
}

export function I18nProvider({
  locale: initialLocale,
  children,
}: {
  locale?: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Derive active locale from props or pathname
  const locale: Locale = useMemo(() => {
    if (initialLocale && isValidLocale(initialLocale)) return initialLocale;
    if (pathname) {
      const segment = pathname.split('/')[1];
      if (isValidLocale(segment)) return segment;
    }
    return DEFAULT_LOCALE;
  }, [initialLocale, pathname]);

  const setLocale = useCallback(
    (newLocale: Locale) => {
      if (newLocale === locale) return;

      // 1. Persist preference in cookie & localStorage
      if (typeof document !== 'undefined') {
        document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
        try {
          localStorage.setItem('rajalakshmi_locale', newLocale);
        } catch {
          // ignore
        }
      }

      // 2. Compute new pathname preserving subroute
      let newPath = pathname;
      const segments = pathname.split('/');
      if (isValidLocale(segments[1])) {
        segments[1] = newLocale;
        newPath = segments.join('/');
      } else {
        newPath = `/${newLocale}${pathname === '/' ? '' : pathname}`;
      }

      const queryString = typeof window !== 'undefined' && window.location.search ? window.location.search : '';
      const finalUrl = `${newPath}${queryString}`;

      router.push(finalUrl);
    },
    [locale, pathname, router]
  );

  const t = useCallback(
    (key: string, values?: Record<string, string | number>): string => {
      const activeMessages = messagesMap[locale] || messagesMap[DEFAULT_LOCALE];
      const fallbackMessages = messagesMap[DEFAULT_LOCALE];

      let value = getNestedValue(activeMessages as unknown as Record<string, unknown>, key);
      if (value === undefined) {
        value = getNestedValue(fallbackMessages as unknown as Record<string, unknown>, key);
      }

      if (typeof value === 'string') {
        return interpolate(value, values);
      }

      return key;
    },
    [locale]
  );

  const contextValue = useMemo(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}

export function useLocale(): Locale {
  const ctx = useContext(I18nContext);
  if (!ctx) return DEFAULT_LOCALE;
  return ctx.locale;
}

export function useChangeLocale() {
  const ctx = useContext(I18nContext);
  return ctx?.setLocale || (() => {});
}

export function useTranslations(namespace?: string) {
  const ctx = useContext(I18nContext);
  const locale = ctx?.locale || DEFAULT_LOCALE;

  const t = useCallback(
    (key: string, values?: Record<string, string | number>): string => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      if (ctx) {
        return ctx.t(fullKey, values);
      }
      // Fallback if rendered outside provider
      const activeMessages = messagesMap[locale] || messagesMap[DEFAULT_LOCALE];
      let val = getNestedValue(activeMessages as unknown as Record<string, unknown>, fullKey);
      if (val === undefined) {
        val = getNestedValue(messagesMap[DEFAULT_LOCALE] as unknown as Record<string, unknown>, fullKey);
      }
      return typeof val === 'string' ? interpolate(val, values) : fullKey;
    },
    [ctx, namespace, locale]
  );

  return t;
}
