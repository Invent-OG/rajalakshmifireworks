'use client';

import React from 'react';
import { Providers } from '@/components/providers';
import { StoreBanner } from '@/components/store/store-banner';
import { FloatingNavbar } from '@/components/store/floating-navbar';

export function StoreHeader() {
  return (
    <Providers>
      <StoreBanner />
      <FloatingNavbar />
    </Providers>
  );
}
