'use client';

import { MobileBottomNav } from '@/components/store/mobile-bottom-nav';
import { QuickCartMobileFloating } from '@/components/store/quick-cart-drawer';
import { StoreBanner } from '@/components/store/store-banner';
import { FloatingNavbar } from '@/components/store/floating-navbar';
import { StickyFooter } from '@/components/store/sticky-footer';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StoreBanner />
      <FloatingNavbar />
      <main className="flex-1 pb-12 md:pb-6">{children}</main>
      <StickyFooter />
      <QuickCartMobileFloating />
      <MobileBottomNav />
    </>
  );
}
