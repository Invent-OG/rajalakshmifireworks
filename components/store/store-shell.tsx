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
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <SmoothScrollProvider>
        <StoreBanner />
        <FloatingNavbar />
        <main className="flex-1 pb-12 md:pb-6">{children}</main>
        <StickyFooter />
        <QuickCartMobileFloating />
        <MobileBottomNav />
      </SmoothScrollProvider>
    </Providers>
  );
}
