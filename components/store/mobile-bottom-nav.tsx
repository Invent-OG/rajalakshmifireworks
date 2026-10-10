'use client';

import { useState, useRef, useEffect } from 'react';
import Link from '@/components/ui/link';
import { usePathname } from '@/lib/navigation';
import { Home, LayoutGrid, Zap, Gift, Download, Loader2 } from 'lucide-react';
import { useCart, useIsHydrated } from '@/hooks/use-cart';
import { useTranslations, useLocale } from '@/lib/i18n/context';
import { toast } from 'sonner';

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
    (typeof window !== 'undefined' ? window.location.pathname + window.location.search : hookPathname) ||
    '/';
  const [currentPath, setCurrentPath] = useState(initialPath);

  // Sync client-side route changes dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => setCurrentPath(window.location.pathname + window.location.search);
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

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadCatalog = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const res = await fetch('/api/products/download');
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const year = new Date().getFullYear();
      a.download = `Rajalakshmi_Fireworks_Catalog_${year}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(
        locale === 'ta'
          ? 'முழு பட்டாசு விலைப்பட்டியல் PDF பதிவிறக்கம் செய்யப்பட்டது!'
          : 'Product catalog PDF downloaded successfully!'
      );
    } catch {
      toast.error(
        locale === 'ta'
          ? 'பதிவிறக்குவதில் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.'
          : 'Failed to download catalog. Please try again.'
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const isQuickOrderActive =
    activePath === '/quick-order' ||
    activePath.startsWith('/quick-order');

  const leftItems = [
    { href: '/', icon: Home, label: tNav('home') },
    { href: '/products', icon: LayoutGrid, label: tNav('products') },
  ];

  const rightItems = [
    {
      href: '/products?combos=true',
      icon: Gift,
      label: locale === 'ta' ? 'காம்போ' : tNav('combos'),
    },
  ];

  const renderNavItem = (item: { href: string; icon: any; label: string; badge?: number }) => {
    const isProductsItem = item.href === '/products';
    const isCombosItem = item.href.includes('combos');

    const isCombosActive =
      currentPath.includes('combos=true') ||
      currentPath.includes('combo=true') ||
      (currentPath.includes('/products') && currentPath.includes('featured=true'));

    const isActive =
      item.href === '/'
        ? activePath === '/'
        : isCombosItem
        ? isCombosActive
        : isProductsItem
        ? (activePath === '/products' ||
           activePath.startsWith('/products/') ||
           activePath.startsWith('/product/') ||
           activePath.startsWith('/category/')) &&
          !isCombosActive
        : activePath === item.href || activePath.startsWith(item.href + '/');

    return (
      <Link
        key={item.href}
        href={getHref(item.href)}
        className="relative flex flex-col items-center justify-center min-w-[50px] py-1 transition-all duration-200 group focus:outline-none"
        aria-label={item.label}
        title={item.label}
      >
        <div
          className={`relative h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 ${
            isActive
              ? 'bg-white text-neutral-950 shadow-sm scale-105'
              : 'text-neutral-400 group-hover:text-white group-hover:bg-white/10'
          }`}
        >
          <item.icon
            className={`h-4.5 w-4.5 transition-transform duration-200 ${
              isActive ? 'text-neutral-950 stroke-[2.5]' : 'text-current stroke-[1.9]'
            }`}
          />

          {typeof item.badge === 'number' && item.badge > 0 && (
            <span
              className={`absolute -top-1 -right-1 h-3.5 min-w-3.5 px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${
                isActive
                  ? 'bg-neutral-950 text-white'
                  : 'bg-[#e24000] text-white shadow-xs'
              }`}
            >
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
        </div>

        <span
          className={`text-[9.5px] tracking-tight leading-none mt-1 transition-colors duration-200 truncate max-w-[56px] text-center ${
            isActive
              ? 'font-bold text-white'
              : 'font-medium text-neutral-400 group-hover:text-white/80'
          }`}
        >
          {item.label}
        </span>
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
        <div className="flex items-center justify-around w-[114px] z-10 pl-1">
          {leftItems.map(renderNavItem)}
        </div>

        {/* Center Scooped Cradle: Elevated Floating 3D Flipping Quick Order Button */}
        <Link
          href={getHref('/quick-order')}
          className="absolute -top-[25px] left-1/2 -translate-x-1/2 flex items-center justify-center group focus:outline-none z-20"
          aria-label={tNav('quickOrder')}
          title={tNav('quickOrder')}
        >
          <div className="relative h-[52px] w-[52px] [perspective:1000px] group-hover:scale-105 group-active:scale-95 transition-transform duration-300">
            <div
              className={`w-full h-full relative [transform-style:preserve-3d] animate-quick-coin-flip ${
                isQuickOrderActive ? 'scale-110' : ''
              }`}
            >
              {/* FRONT FACE: Glowing Lightning Bolt Logo */}
              <div
                className={`absolute inset-0 rounded-full bg-gradient-to-tr from-[#b82e00] via-[#e24000] to-[#ff6d24] flex items-center justify-center text-white shadow-[0_8px_24px_rgba(226,64,0,0.55)] border border-white/25 [backface-visibility:hidden] [webkit-backface-visibility:hidden] ${
                  isQuickOrderActive
                    ? 'ring-4 ring-white shadow-[0_0_24px_rgba(255,255,255,0.85),0_10px_28px_rgba(226,64,0,0.75)]'
                    : ''
                }`}
              >
                <Zap className="h-6 w-6 text-white fill-white drop-shadow-xs" />
              </div>

              {/* BACK FACE: Quick Order Text Label */}
              <div
                className={`absolute inset-0 rounded-full bg-gradient-to-tr from-[#992400] via-[#c73500] to-[#e85514] flex flex-col items-center justify-center text-white shadow-[0_8px_24px_rgba(226,64,0,0.55)] border border-white/25 [backface-visibility:hidden] [webkit-backface-visibility:hidden] [transform:rotateY(180deg)] px-1 ${
                  isQuickOrderActive
                    ? 'ring-4 ring-white shadow-[0_0_24px_rgba(255,255,255,0.85),0_10px_28px_rgba(226,64,0,0.75)]'
                    : ''
                }`}
              >
                <span className="text-[9px] font-black tracking-wider uppercase text-white leading-none drop-shadow-xs">
                  {locale === 'ta' ? 'விரைவு' : 'QUICK'}
                </span>
                <span className="text-[7.5px] font-black tracking-widest uppercase text-amber-300 leading-none mt-0.5 drop-shadow-xs">
                  {locale === 'ta' ? 'ஆர்டர்' : 'ORDER'}
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* Right Action Buttons */}
        <div className="flex items-center justify-around w-[114px] z-10 pr-1">
          {rightItems.map(renderNavItem)}

          {/* Download Entire Catalog Button (No page redirection) */}
          <button
            type="button"
            onClick={handleDownloadCatalog}
            disabled={isDownloading}
            className="relative flex flex-col items-center justify-center min-w-[50px] py-1 transition-all duration-200 group focus:outline-none cursor-pointer"
            aria-label={locale === 'ta' ? 'விலைப் பட்டியல் பதிவிறக்கம்' : 'Download Catalog'}
            title={locale === 'ta' ? 'விலைப் பட்டியல் பதிவிறக்கம்' : 'Download Full Catalog'}
          >
            <div className="relative h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 text-neutral-400 group-hover:text-white group-hover:bg-white/10 group-active:scale-95">
              {isDownloading ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin text-amber-400" />
              ) : (
                <Download className="h-4.5 w-4.5 transition-transform duration-200 text-current stroke-[1.9] group-hover:-translate-y-0.5" />
              )}
            </div>

            <span className="text-[9.5px] tracking-tight leading-none mt-1 transition-colors duration-200 truncate max-w-[56px] text-center font-medium text-neutral-400 group-hover:text-white/80">
              {locale === 'ta' ? 'பதிவிறக்கு' : 'Download'}
            </span>
          </button>
        </div>
      </nav>

      {/* 3D Coin Flip Keyframes for Quick Order Button */}
      <style>{`
        @keyframes quickCoinFlip {
          0%, 38% {
            transform: rotateY(0deg);
          }
          48%, 88% {
            transform: rotateY(180deg);
          }
          98%, 100% {
            transform: rotateY(360deg);
          }
        }
        .animate-quick-coin-flip {
          animation: quickCoinFlip 5.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
