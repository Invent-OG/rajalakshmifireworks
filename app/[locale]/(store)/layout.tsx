import { MobileBottomNav } from '@/components/store/mobile-bottom-nav';
import { QuickCartMobileFloating } from '@/components/store/quick-cart-drawer';
import { StoreBanner } from '@/components/store/store-banner';
import { FloatingNavbar } from '@/components/store/floating-navbar';
import { StickyFooter } from '@/components/store/sticky-footer';
import { notFound } from 'next/navigation';
import { isValidLocale, Locale } from '@/lib/i18n/config';

export default async function StoreLocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

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
