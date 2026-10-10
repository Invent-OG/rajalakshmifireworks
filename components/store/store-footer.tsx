'use client';

import React from 'react';
import { Providers } from '@/components/providers';
import { StickyFooter } from '@/components/store/sticky-footer';
import { QuickCartMobileFloating } from '@/components/store/quick-cart-drawer';
import { MobileBottomNav } from '@/components/store/mobile-bottom-nav';
import { FloatingWhatsAppButton } from '@/components/store/floating-whatsapp-button';

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
      <FloatingWhatsAppButton locale={locale} />
    </Providers>
  );
}
