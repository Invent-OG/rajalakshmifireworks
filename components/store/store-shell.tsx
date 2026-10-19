'use client';

import React from 'react';
import { Providers } from '@/components/providers';
import { SmoothScrollProvider } from '@/components/providers/smooth-scroll-provider';
import { StoreBanner } from '@/components/store/store-banner';
import { FloatingNavbar } from '@/components/store/floating-navbar';
import { StickyFooter } from '@/components/store/sticky-footer';
import { QuickCartMobileFloating } from '@/components/store/quick-cart-drawer';
import { MobileBottomNav } from '@/components/store/mobile-bottom-nav';

export function StoreShell({
  children,
  pathname,
  locale,
}: {
  children: React.ReactNode;
  pathname?: string;
  locale?: string;
}) {
  return (
    <Providers>
      <SmoothScrollProvider>
        <StoreBanner />
        <FloatingNavbar pathname={pathname} locale={locale} />
        <main className="flex-1 pb-12 md:pb-6">{children}</main>
        <StickyFooter />
        <QuickCartMobileFloating pathname={pathname} locale={locale} />
        <MobileBottomNav pathname={pathname} locale={locale} />
      </SmoothScrollProvider>
    </Providers>
  );
}
