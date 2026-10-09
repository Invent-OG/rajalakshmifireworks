'use client';

import React from 'react';
import { Providers } from '@/components/providers';
import { StoreBanner } from '@/components/store/store-banner';
import { FloatingNavbar } from '@/components/store/floating-navbar';

interface StoreHeaderProps {
  pathname?: string;
  locale?: string;
}

export function StoreHeader({ pathname, locale }: StoreHeaderProps = {}) {
  return (
    <Providers>
      <StoreBanner />
      <FloatingNavbar pathname={pathname} locale={locale} />
    </Providers>
  );
}
