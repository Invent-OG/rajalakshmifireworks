'use client';

import { useState, useRef, useEffect } from 'react';
import Link from '@/components/ui/link';
import { usePathname } from '@/lib/navigation';
import { Home, LayoutGrid, Zap, Truck, ShoppingBag } from 'lucide-react';
import { useCart, useIsHydrated } from '@/hooks/use-cart';
import { useTranslations, useLocale } from '@/lib/i18n/context';

interface MobileBottomNavProps {
  pathname?: string;
  locale?: string;
}

export function MobileBottomNav({
  pathname: propPathname,
  locale: propLocale,
}: MobileBottomNavProps = {}) {
  const hookPathname = usePathname();
  const contextLocale = useLocale();
  const locale = (propLocale as any) || contextLocale;
  const tNav = useTranslations('navigation');
  const { itemCount } = useCart();
  const isHydrated = useIsHydrated();
  const displayCount = isHydrated ? itemCount : 0;
  const hasItems = displayCount > 0;

  const navRef = useRef<HTMLElement | null>(null);
  const [navWidth, setNavWidth] = useState(340);
  const initialPath =
    propPathname ||
    (typeof window !== 'undefined' ? window.location.pathname : hookPathname) ||
    '/';
  const [currentPath, setCurrentPath] = useState(initialPath);

  // Sync client-side route changes dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => setCurrentPath(window.location.pathname);
    update();
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);

  useEffect(() => {
    if (!navRef.current) return;
    const updateWidth = () => {
      if (navRef.current) {
        const rect = navRef.current.getBoundingClientRect();
        if (rect.width > 0) {
          setNavWidth(Math.round(rect.width));
        }
      }
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(navRef.current);
    return () => observer.disconnect();
  }, []);

  // Normalize path removing locale prefix and trailing slashes for robust route matching
  const normalizePath = (p: string) => {
    if (!p) return '/';
    const withoutLocale = p.replace(/^\/(?:en|ta)(?=\/|$)/, '') || '/';
    return withoutLocale.length > 1 && withoutLocale.endsWith('/')
      ? withoutLocale.slice(0, -1)
      : withoutLocale || '/';
  };

  const activePath = normalizePath(currentPath || hookPathname);

  // Always generate localized URLs matching the application router (e.g. /en/products, /en/cart)
  const getHref = (path: string) => {
    if (!path) return `/${locale}`;
    if (path.startsWith('http') || path.startsWith('#')) return path;
    const clean = path.startsWith('/') ? path : `/${path}`;
    return `/${locale}${clean === '/' ? '' : clean}`;
  };

  // Don't show bottom nav on checkout to prevent distractions
  if (activePath === '/checkout') return null;

  const w = navWidth;
  const h = 64;
  const r = 32;
  const cx = w / 2;

  // Ultra-smooth, gentle organic S-curve scooped notch cradle
  // C1 continuous with zero pinches or vertical cliffs
  const pathD = [
    `M ${r} 0`,
    `L ${cx - 48} 0`,
    `C ${cx - 38} 0, ${cx - 32} 6, ${cx - 28} 14`,
    `C ${cx - 24} 22, ${cx - 14} 35, ${cx} 35`,
    `C ${cx + 14} 35, ${cx + 24} 22, ${cx + 28} 14`,
    `C ${cx + 32} 6, ${cx + 38} 0, ${cx + 48} 0`,
    `L ${w - r} 0`,
    `A ${r} ${r} 0 0 1 ${w} ${r}`,
    `A ${r} ${r} 0 0 1 ${w - r} ${h}`,
    `L ${r} ${h}`,
    `A ${r} ${r} 0 0 1 0 ${r}`,
    `A ${r} ${r} 0 0 1 ${r} 0`,
    `Z`,
  ].join(' ');

  const isQuickOrderActive =
    activePath === '/quick-order' ||
    activePath.startsWith('/quick-order');

  const leftItems = [
    { href: '/', icon: Home, label: tNav('home') },
    { href: '/products', icon: LayoutGrid, label: tNav('catalog') },
  ];

  const rightItems = [
    { href: '/track-order', icon: Truck, label: tNav('trackOrder') },
    { href: '/cart', icon: ShoppingBag, label: tNav('bag'), badge: displayCount },
  ];

  const renderNavItem = (item: { href: string; icon: any; label: string; badge?: number }) => {
    const isProductsItem = item.href === '/products';
    const isActive =
      item.href === '/'
        ? activePath === '/'
        : isProductsItem
        ? activePath === '/products' ||
          activePath.startsWith('/products/') ||
          activePath.startsWith('/product/') ||
          activePath.startsWith('/category/')
        : activePath === item.href || activePath.startsWith(item.href + '/');

    return (
      <Link
        key={item.href}
        href={getHref(item.href)}
        className={`relative h-11 w-11 rounded-full flex items-center justify-center transition-all duration-300 ${isActive
            ? 'bg-white text-neutral-950 shadow-md scale-105'
            : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        aria-label={item.label}
        title={item.label}
      >
        <item.icon
          className={`h-5 w-5 transition-transform duration-200 ${isActive ? 'text-neutral-950 stroke-[2.5]' : 'text-white/80 stroke-[1.8]'
            }`}
        />

        {typeof item.badge === 'number' && item.badge > 0 && (
          <span
            className={`absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${isActive
                ? 'bg-neutral-950 text-white shadow-xs'
                : 'bg-white text-neutral-950 shadow-xs'
              }`}
          >
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div
      className={`md:hidden fixed bottom-4 left-0 right-0 z-50 px-4 pointer-events-none transition-all duration-300 ease-in-out ${
        hasItems
          ? 'translate-y-28 opacity-0 pointer-events-none'
          : 'translate-y-0 opacity-100'
      }`}
    >
      <nav
        ref={navRef}
        aria-label="Mobile Navigation"
        className={`relative mx-auto max-w-[340px] w-full h-16 flex items-center justify-between px-3 ${
          hasItems ? 'pointer-events-none' : 'pointer-events-auto'
        }`}
      >
        {/* Curved Border-Bending SVG Background with Center Scoop Notch */}
        <svg
          className="absolute inset-0 w-full h-full overflow-visible pointer-events-none drop-shadow-[0_12px_36px_rgba(0,0,0,0.65)]"
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d={pathD}
            className="fill-neutral-950 dark:fill-[#121212] stroke-neutral-800/90 dark:stroke-[#383838]"
            strokeWidth="1.5"
          />
        </svg>

        {/* Left Action Buttons */}
        <div className="flex items-center gap-1.5 z-10 pl-1">
          {leftItems.map(renderNavItem)}
        </div>

        {/* Center Scooped Cradle: Elevated Floating Quick Order Button */}
        <Link
          href={getHref('/quick-order')}
          className="absolute -top-[25px] left-1/2 -translate-x-1/2 flex items-center justify-center group focus:outline-none z-20"
          aria-label={tNav('quickOrder')}
          title={tNav('quickOrder')}
        >
          <div
            className={`h-[54px] w-[54px] rounded-full bg-gradient-to-tr from-[#b82e00] via-[#e24000] to-[#ff6d24] flex items-center justify-center text-white transition-all duration-300 shadow-[0_8px_24px_rgba(226,64,0,0.55)] group-hover:scale-105 group-active:scale-95 ${isQuickOrderActive
                ? 'scale-110 ring-4 ring-white shadow-[0_0_24px_rgba(255,255,255,0.85),0_10px_28px_rgba(226,64,0,0.75)]'
                : 'border border-white/20'
              }`}
          >
            <Zap className="h-6 w-6 text-white fill-white drop-shadow-xs" />
          </div>
        </Link>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1.5 z-10 pr-1">
          {rightItems.map(renderNavItem)}
        </div>
      </nav>
    </div>
  );
}
