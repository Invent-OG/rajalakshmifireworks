'use client';

import React from 'react';
import { Providers } from '@/components/providers';
import { StickyFooter } from '@/components/store/sticky-footer';
import { QuickCartMobileFloating } from '@/components/store/quick-cart-drawer';
import { MobileBottomNav } from '@/components/store/mobile-bottom-nav';

interface StoreFooterProps {
  pathname?: string;
  locale?: string;
}

export function StoreFooter({ pathname, locale }: StoreFooterProps = {}) {
  return (
    <Providers>
      <StickyFooter />
      <QuickCartMobileFloating />
      <MobileBottomNav pathname={pathname} locale={locale} />
    </Providers>
  );
}
