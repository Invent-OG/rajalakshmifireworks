'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { CartProvider } from '@/hooks/use-cart';
import { I18nProvider } from '@/lib/i18n/context';

export const sharedQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ locale, children }: { locale?: string; children: React.ReactNode }) {

  return (
    <QueryClientProvider client={sharedQueryClient}>
      <I18nProvider locale={locale as any}>
        <CartProvider>
          {children}
        </CartProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
