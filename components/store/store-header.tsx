'use client';

import React from 'react';
import { Providers } from '@/components/providers';
import { StoreBanner } from '@/components/store/store-banner';
import { FloatingNavbar } from '@/components/store/floating-navbar';
import { QuickCartMobileFloating } from '@/components/store/quick-cart-drawer';

interface StoreHeaderProps {
  pathname?: string;
  locale?: string;
}

export function StoreHeader({ pathname, locale }: StoreHeaderProps = {}) {
  return (
    <Providers locale={locale}>
      <StoreBanner />
      <FloatingNavbar pathname={pathname} locale={locale} />
      <QuickCartMobileFloating pathname={pathname} locale={locale} />
    </Providers>
  );
}
