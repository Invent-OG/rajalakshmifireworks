'use client';

import Link from '@/components/ui/link';
import { usePathname } from '@/lib/navigation';
import { Home, LayoutGrid, Zap, Truck, ShoppingBag } from 'lucide-react';
import { useCart, useIsHydrated } from '@/hooks/use-cart';
import { useTranslations, useLocale } from '@/lib/i18n/context';

export function MobileBottomNav() {
  const pathname = usePathname();
  const locale = useLocale();
  const tNav = useTranslations('navigation');
  const { itemCount } = useCart();
  const isHydrated = useIsHydrated();
  const displayCount = isHydrated ? itemCount : 0;

  // Extract clean path by removing locale prefix (/en, /ta)
  const cleanPath = pathname ? pathname.replace(/^\/(?:en|ta)(?=\/|$)/, '') || '/' : '/';

  const getHref = (path: string) => (locale === 'en' ? path : `/${locale}${path === '/' ? '' : path}`);

  const navItems = [
    { href: '/', icon: Home, label: tNav('home') },
    { href: '/price-list', icon: LayoutGrid, label: tNav('priceList') },
    { href: '/products', icon: Zap, label: tNav('quickOrder'), isHighlight: true },
    { href: '/track-order', icon: Truck, label: tNav('trackOrder') },
    { href: '/cart', icon: ShoppingBag, label: tNav('bag'), badge: displayCount },
  ];

  // Don't show bottom nav on checkout to prevent distractions
  if (cleanPath === '/checkout') return null;

  return (
    <div className="md:hidden fixed bottom-4 left-0 right-0 z-50 px-4 pointer-events-none transition-all">
      <nav
        aria-label="Mobile Navigation"
        className="mx-auto max-w-[340px] w-full pointer-events-auto rounded-full bg-neutral-950 dark:bg-[#121212] text-white p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.65)] dark:border dark:border-[#383838] flex items-center justify-between backdrop-blur-xl relative"
      >
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? cleanPath === '/'
              : cleanPath === item.href ||
                cleanPath.startsWith(item.href + '/') ||
                (item.href === '/products' && (cleanPath.startsWith('/product/') || cleanPath.startsWith('/category/')));

          if (item.isHighlight) {
            return (
              <Link
                key={item.href}
                href={getHref(item.href)}
                className="relative -top-3.5 flex items-center justify-center shrink-0 group focus:outline-none"
                aria-label={item.label}
                title={item.label}
              >
                <div
                  className={`h-12 w-12 rounded-full bg-gradient-to-tr from-[#b82e00] via-[#e24000] to-[#ff6d24] flex items-center justify-center text-white ring-4 ring-neutral-950 dark:ring-[#121212] transition-all duration-300 shadow-[0_8px_24px_rgba(226,64,0,0.55)] group-hover:scale-105 group-active:scale-95 ${
                    isActive
                      ? 'scale-105 ring-white/30 shadow-[0_10px_28px_rgba(226,64,0,0.75)]'
                      : ''
                  }`}
                >
                  <Zap className="h-6 w-6 text-white fill-white drop-shadow-xs" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={getHref(item.href)}
              className={`relative h-11 w-11 rounded-full flex items-center justify-center transition-all duration-300 ${
                isActive
                  ? 'bg-white text-neutral-950 shadow-md scale-105'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              aria-label={item.label}
              title={item.label}
            >
              <item.icon
                className={`h-5 w-5 transition-transform duration-200 ${
                  isActive ? 'text-neutral-950 stroke-[2.5]' : 'text-white/80 stroke-[1.8]'
                }`}
              />

              {/* Notification/Count Badge for Bag or Track */}
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span
                  className={`absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    isActive
                      ? 'bg-neutral-950 text-white shadow-xs'
                      : 'bg-white text-neutral-950 shadow-xs'
                  }`}
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
