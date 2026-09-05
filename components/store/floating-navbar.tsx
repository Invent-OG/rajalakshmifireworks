'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  ShoppingBag,
  Sparkles,
  Download,
  Flame,
  ShieldCheck,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  Package,
  Layers,
  Award,
} from 'lucide-react';
import { BrandLogo } from '@/components/ui/brand-logo';
import { useCart, useIsHydrated } from '@/hooks/use-cart';

interface MegaMenuContent {
  id: string;
  label: string;
  items: Array<{
    title: string;
    description: string;
    href: string;
    badge?: string;
  }>;
  featuredSectionTitle: string;
  featuredCards: Array<{
    title: string;
    description: string;
    href: string;
    image: string;
    badge: string;
  }>;
}

const MEGA_MENUS: Record<string, MegaMenuContent> = {
  categories: {
    id: 'categories',
    label: 'Categories',
    items: [
      {
        title: 'Ground Spinners & Chakkars',
        description: 'Vibrant spinning wheels, flower pots, and long-lasting sparklers for all ages.',
        href: '/products?category=ground-chakkars',
      },
      {
        title: 'Aerial Repeaters & Sky Shots',
        description: 'Spectacular multi-shot bursts, whistling rockets, and glittering night sky effects.',
        href: '/products?category=aerial-shots',
      },
      {
        title: 'Festive Sound Crackers',
        description: 'Classic Sivakasi sound crackers, bijili strips, and traditional celebration rolls.',
        href: '/products?category=sound-crackers',
      },
      {
        title: 'Safe & Certified Green Crackers',
        description: '100% CSIR-NEERI certified low-emission formulations with QR authentication.',
        href: '/products?certified=green',
      },
    ],
    featuredSectionTitle: 'Featured collections',
    featuredCards: [
      {
        title: '2026 Mega Family Diwali Combo Box',
        description: 'Curated 35+ items for a complete family celebration direct from Sivakasi factory.',
        href: '/products?featured=true',
        image: '/images/3d/cat-family-packs.jpg',
        badge: 'Top Seller',
      },
      {
        title: 'Wholesale Direct Factory Price List',
        description: 'Enjoy 70%+ festive discount with 100% genuine factory-sealed packaging.',
        href: '/products',
        image: '/images/3d/usp-wholesale-value.jpg',
        badge: 'Direct Sivakasi',
      },
    ],
  },
  combos: {
    id: 'combos',
    label: 'Combos',
    items: [
      {
        title: 'Family Celebration Packs',
        description: 'All-in-one assortment boxes designed for 4-8 family members.',
        href: '/products?category=family-packs',
      },
      {
        title: 'Kids Special Novelty Box',
        description: 'Zero-sound, colorful sparklers, pencil torches, and magical fancy fountains.',
        href: '/products?category=kids-special',
      },
      {
        title: 'Royal VIP Night Sky Pack',
        description: 'Premium multi-shot aerial cakes, giant parachutes, and high-altitude repeaters.',
        href: '/products?category=vip-combos',
      },
    ],
    featuredSectionTitle: 'Curated gift boxes',
    featuredCards: [
      {
        title: 'Grand Diwali Sovereign Gift Box',
        description: 'Luxurious gift presentation box packed with Sivakasi finest fireworks.',
        href: '/products?featured=true',
        image: '/images/3d/cat-gift-boxes.jpg',
        badge: 'Festive Special',
      },
      {
        title: 'Direct Wholesale Bulk Combos',
        description: 'Ideal for community celebrations, societies, and corporate festive gifts.',
        href: '/products',
        image: '/images/3d/usp-curated-combos.jpg',
        badge: 'Wholesale Tier',
      },
    ],
  },
  about: {
    id: 'about',
    label: 'Safety',
    items: [
      {
        title: 'Green Crackers Certification',
        description: 'Understand CSIR-NEERI standards, QR code verification, and eco safety.',
        href: '/products?certified=green',
      },
      {
        title: 'Family Bursting Safety Guide',
        description: 'Essential safety precautions, water bucket prep, and child supervision tips.',
        href: '/track-order',
      },
      {
        title: 'Direct From Sivakasi Guarantee',
        description: '100% fresh batch manufacturing, moisture-proof sealed packaging.',
        href: '/products',
      },
    ],
    featuredSectionTitle: 'Safety & Trust',
    featuredCards: [
      {
        title: 'Certified Safe Green Fireworks',
        description: 'Reduced particulate emissions without compromising on sparkle and sound.',
        href: '/products?certified=green',
        image: '/images/3d/usp-sivakasi-direct.jpg',
        badge: '100% Certified',
      },
      {
        title: 'Doorstep Courier & Transport Dispatch',
        description: 'Compliant logistics with real-time SMS and WhatsApp dispatch notifications.',
        href: '/track-order',
        image: '/images/3d/usp-flexible-dispatch.jpg',
        badge: 'Fast Dispatch',
      },
    ],
  },
};

export function FloatingNavbar() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const isHydrated = useIsHydrated();
  const displayCount = isHydrated ? itemCount : 0;

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navContainerRef = useRef<HTMLDivElement | null>(null);

  // Close mega menu on route change
  useEffect(() => {
    setActiveMenu(null);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setActiveMenu(null);
        setMobileMenuOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navContainerRef.current && !navContainerRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseEnter = (menuKey: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setActiveMenu(menuKey);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 200); // 200ms grace period for smooth cursor movement
  };

  const currentMegaMenu = activeMenu ? MEGA_MENUS[activeMenu] : null;

  return (
    <div
      ref={navContainerRef}
      className="sticky top-0 z-50 w-full pt-3 px-3 sm:px-6 pointer-events-auto transition-all duration-300"
      onMouseLeave={handleMouseLeave}
    >
      <div className="max-w-6xl mx-auto relative">
        {/* Floating Frosted Pill Bar with White Glassmorphism */}
        <header className="relative h-14 sm:h-16 px-3 sm:px-5 rounded-full bg-white/95 backdrop-blur-xl border border-neutral-200/90 text-neutral-900 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.1),0_0_1px_1px_rgba(0,0,0,0.05)] grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 transition-all duration-300">
          {/* Left Column: Capsule Pill Navigation Links & Mobile Hamburger */}
          <div className="flex items-center justify-start min-w-0">
            {/* Mobile Menu Hamburger Button */}
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors border border-neutral-200"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>

            {/* Desktop Capsule Pill Navigation (Light Sub-Capsule) */}
            <nav className="hidden md:inline-flex items-center gap-0.5 bg-neutral-100/90 p-1 rounded-full border border-neutral-200/60 shadow-inner shrink-0">
              <Link
                href="/products"
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                  pathname === '/products' && !activeMenu
                    ? 'bg-white text-neutral-950 font-semibold shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-950 hover:bg-white/80'
                }`}
              >
                Catalog
              </Link>

              {Object.keys(MEGA_MENUS).map((key) => {
                const menu = MEGA_MENUS[key];
                const isHovered = activeMenu === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onMouseEnter={() => handleMouseEnter(key)}
                    onClick={() => setActiveMenu(activeMenu === key ? null : key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1 cursor-pointer select-none whitespace-nowrap ${
                      isHovered
                        ? 'bg-white text-neutral-950 font-semibold shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-950 hover:bg-white/80'
                    }`}
                    aria-expanded={isHovered}
                  >
                    <span>{menu.label}</span>
                    <ChevronDown
                      className={`h-3 w-3 transition-transform duration-200 ${
                        isHovered ? 'rotate-180 text-neutral-950' : 'text-neutral-400'
                      }`}
                    />
                  </button>
                );
              })}

              <Link
                href="/track-order"
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                  pathname === '/track-order' && !activeMenu
                    ? 'bg-white text-neutral-950 font-semibold shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-950 hover:bg-white/80'
                }`}
              >
                Track
              </Link>
            </nav>
          </div>

          {/* Center Column: Brand Logo (Guaranteed non-overlapping center) */}
          <div className="flex items-center justify-center px-1 shrink-0">
            <Link href="/" className="flex items-center gap-2 group py-1">
              <BrandLogo className="h-7 sm:h-8 md:h-9 max-h-9 w-auto transition-transform duration-200 group-hover:scale-105 drop-shadow-sm shrink-0" />
            </Link>
          </div>

          {/* Right Column: Action Buttons (Search + Download/Price List + Bag) */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Search Button */}
            <Link
              href="/search"
              className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-100/90 hover:bg-neutral-200/80 text-neutral-600 hover:text-neutral-950 text-xs font-medium border border-neutral-200/60 transition-all whitespace-nowrap"
            >
              <Search className="h-3.5 w-3.5 text-neutral-400" />
              <span>Search...</span>
            </Link>

            <Link
              href="/search"
              className="lg:hidden h-8 w-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200 transition-colors"
              aria-label="Search"
            >
              <Search className="h-3.5 w-3.5" />
            </Link>

            {/* Download Price List Pill Button */}
            <Link
              href="/products"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-100/90 hover:bg-neutral-200/80 border border-neutral-200/60 text-neutral-800 text-xs font-medium transition-all active:scale-95 shadow-xs whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5 text-brand" />
              <span>Price List</span>
            </Link>

            {/* Shopping Bag Pill */}
            <Link
              href="/cart"
              className="relative h-8 sm:h-9 px-3.5 rounded-full bg-brand text-white text-xs font-semibold hover:bg-brand/90 active:scale-95 transition-all flex items-center gap-1.5 shadow-md whitespace-nowrap"
              aria-label={`Shopping bag with ${displayCount} items`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Bag</span>
              {displayCount > 0 && (
                <span className="h-4 min-w-4 px-1 rounded-full bg-white text-brand text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {displayCount > 99 ? '99+' : displayCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Mega Dropdown Panel (Clean White Card) */}
        {currentMegaMenu && (
          <div
            className="absolute top-full left-0 right-0 pt-2 z-50 animate-in fade-in zoom-in-95 duration-200"
            onMouseEnter={() => {
              if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
              }
            }}
            onMouseLeave={handleMouseLeave}
          >
            <div className="rounded-3xl bg-white text-neutral-900 shadow-2xl border border-neutral-200/90 p-6 sm:p-8 overflow-hidden backdrop-blur-xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: List of Categories/Articles (5 cols) */}
                <div className="lg:col-span-5 space-y-5">
                  {currentMegaMenu.items.map((item, idx) => (
                    <Link
                      key={idx}
                      href={item.href}
                      onClick={() => setActiveMenu(null)}
                      className="group block space-y-1 transition-all p-2.5 -mx-2.5 rounded-2xl hover:bg-neutral-50"
                    >
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm sm:text-base text-neutral-900 group-hover:text-brand transition-colors">
                          {item.title}
                        </h3>
                        {item.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand/10 text-brand uppercase tracking-wider">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-neutral-600 group-hover:text-neutral-800 leading-relaxed transition-colors">
                        {item.description}
                      </p>
                    </Link>
                  ))}
                </div>

                {/* Right Column: 2 Featured Cards (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    {currentMegaMenu.featuredSectionTitle}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentMegaMenu.featuredCards.map((card, idx) => (
                      <Link
                        key={idx}
                        href={card.href}
                        onClick={() => setActiveMenu(null)}
                        className="group flex flex-col space-y-3 cursor-pointer p-2.5 -m-2.5 rounded-2xl hover:bg-neutral-50 transition-all"
                      >
                        {/* Thumbnail Image Container */}
                        <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200/80 shadow-xs">
                          <img
                            src={card.image}
                            alt={card.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute top-2.5 left-2.5">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-neutral-900/80 text-white backdrop-blur-md border border-white/20 uppercase tracking-wider shadow-sm">
                              {card.badge}
                            </span>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h5 className="font-semibold text-xs sm:text-sm text-neutral-900 group-hover:text-brand transition-colors line-clamp-2 leading-snug">
                            {card.title}
                          </h5>
                          <p className="text-[11px] sm:text-xs text-neutral-500 mt-1 line-clamp-2">
                            {card.description}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Slide-down Menu (White Background) */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 pt-2 z-50 animate-in fade-in duration-200">
            <div className="rounded-3xl bg-white text-neutral-900 border border-neutral-200/90 p-5 shadow-2xl space-y-5">
              <div className="space-y-1">
                <Link
                  href="/products"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-semibold hover:bg-neutral-100 text-neutral-900"
                >
                  All Fireworks & Catalog
                </Link>
                <Link
                  href="/products?featured=true"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                >
                  Diwali Family Combos
                </Link>
                <Link
                  href="/products?certified=green"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                >
                  Green Certified Fireworks
                </Link>
                <Link
                  href="/track-order"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                >
                  Track Order Online
                </Link>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-between gap-2">
                <Link
                  href="/products"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-xs font-medium text-neutral-800 shadow-xs"
                >
                  <Download className="h-3.5 w-3.5 text-brand" />
                  <span>Price List</span>
                </Link>

                <Link
                  href="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand text-xs font-semibold text-white shadow-md"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Bag ({displayCount})</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
