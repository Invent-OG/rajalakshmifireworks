'use client';

import React from 'react';
import { Providers } from '@/components/providers';
import { StickyFooter } from '@/components/store/sticky-footer';
import { QuickCartMobileFloating } from '@/components/store/quick-cart-drawer';
import { MobileBottomNav } from '@/components/store/mobile-bottom-nav';

export function StoreFooter() {
  return (
    <Providers>
      <StickyFooter />
      <QuickCartMobileFloating />
      <MobileBottomNav />
    </Providers>
  );
}
