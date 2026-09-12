'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  ShoppingBag,
  Download,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { BrandLogo } from '@/components/ui/brand-logo';
import { LanguageSelector } from '@/components/ui/language-selector';
import { useCart, useIsHydrated } from '@/hooks/use-cart';
import { getCategory3DImage } from '@/components/ui/category-icon';
import { formatCurrency, toNumber } from '@/lib/utils/format';
import { useLocale, useTranslations } from '@/lib/i18n/context';
import { getLocalizedName, getLocalizedDescription } from '@/lib/i18n/formatters';

interface CategoryItem {
  id: number;
  name: string;
  nameTa?: string | null;
  slug: string;
  description: string | null;
  descriptionTa?: string | null;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface ComboProductItem {
  id: number;
  name: string;
  nameTa?: string | null;
  slug: string;
  description: string | null;
  descriptionTa?: string | null;
  mrp: string | number;
  sellingPrice: string | number;
  isCombo: boolean;
  isActive: boolean;
  media?: Array<{ url: string }>;
  category?: { name: string; nameTa?: string | null; slug: string } | null;
}

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

// Fallback seed categories if API is loading
const DEFAULT_FALLBACK_CATEGORIES: CategoryItem[] = [
  { id: 1, name: 'Sparklers', nameTa: 'கம்பி மத்தாப்பு', slug: 'sparklers', description: 'Safe handheld sparklers in gold, silver, and vibrant colors', descriptionTa: 'தங்கம், வெள்ளி மற்றும் பல வண்ணங்களில் ஒளிரும் பாதுகாப்பான கம்பி மத்தாப்புகள்', image: '/images/3d/cat-sparklers.jpg', sortOrder: 1, isActive: true },
  { id: 2, name: 'Flower Pots', nameTa: 'பூந்தொட்டி', slug: 'flower-pots', description: 'Vibrant fountain cones with dazzling colorful sparkles', descriptionTa: 'வானில் வர்ணஜாலம் காட்டும் வண்ணமயமான பூந்தொட்டி பட்டாசுகள்', image: '/images/3d/cat-flower-pots.jpg', sortOrder: 2, isActive: true },
  { id: 3, name: 'Rockets', nameTa: 'ராக்கெட்', slug: 'rockets', description: 'High-flying aerial whistles with sky bursts', descriptionTa: 'விண்ணை முட்டும் விசிலுடன் வான்வெளியில் வெடிக்கும் ராக்கெட்டுகள்', image: '/images/3d/cat-rockets.jpg', sortOrder: 3, isActive: true },
  { id: 4, name: 'Chakras', nameTa: 'சக்கரம்', slug: 'chakras', description: 'Fast-spinning ground wheels with dazzling golden rings', descriptionTa: 'தரைப்பரப்பில் மின்னல் வேகத்தில் சுழலும் தங்க வளைய சக்கரங்கள்', image: '/images/3d/cat-chakras.jpg', sortOrder: 4, isActive: true },
  { id: 5, name: 'Fountains', nameTa: 'பவுண்டன் / ஃபேன்ஸி', slug: 'fountains', description: 'Long-duration multi-color fountain cones and fountain pots', descriptionTa: 'நீண்ட நேரம் பல வண்ணங்களை உமிழும் பிரம்மாண்ட பவுண்டன் பட்டாசுகள்', image: '/images/3d/cat-fountains.jpg', sortOrder: 5, isActive: true },
  { id: 6, name: 'Sound Crackers', nameTa: 'வெடி & சரவெடி', slug: 'sound-crackers', description: 'Traditional Sivakasi single sound and garland wala crackers', descriptionTa: 'பாரம்பரிய சிவகாசி தனி வெடிகள் மற்றும் மங்கல சரவெடிகள்', image: '/images/3d/cat-sound-crackers.jpg', sortOrder: 6, isActive: true },
  { id: 7, name: 'Gift Boxes', nameTa: 'கிஃப்ட் பாக்ஸ்', slug: 'gift-boxes', description: 'Premium curated gift packages with crackers for the whole family', descriptionTa: 'முழுக் குடும்பத்திற்கும் ஏற்ற சிறப்பு தீபாவளி பரிசுப் பெட்டிகள்', image: '/images/3d/cat-gift-boxes.jpg', sortOrder: 7, isActive: true },
  { id: 8, name: 'Family Packs', nameTa: 'பேமிலி காம்போ பேக்', slug: 'family-packs', description: 'Mega value celebration packages with assorted cracker items', descriptionTa: 'அனைத்து வகை பட்டாசுகளும் அடங்கிய மெகா தீபாவளி தொகுப்பு', image: '/images/3d/cat-family-packs.jpg', sortOrder: 8, isActive: true },
];

export function FloatingNavbar() {
  const pathname = usePathname();
  const locale = useLocale();
  const tNav = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const { itemCount } = useCart();
  const isHydrated = useIsHydrated();
  const displayCount = isHydrated ? itemCount : 0;

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navContainerRef = useRef<HTMLDivElement | null>(null);

  // 1. Fetch categories from admin panel / database
  const { data: categoriesData } = useQuery<{ categories: CategoryItem[] }>({
    queryKey: ['categories', 'list'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) return { categories: DEFAULT_FALLBACK_CATEGORIES };
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  // 2. Fetch combo products from admin panel / database
  const { data: combosData } = useQuery<{ products: ComboProductItem[] }>({
    queryKey: ['products', 'combos', 'navbar'],
    queryFn: async () => {
      const res = await fetch('/api/products?combo=true&limit=30');
      if (!res.ok) return { products: [] };
      return res.json();
    },
    staleTime: 1000 * 60 * 3,
  });

  const activeCategories = useMemo(() => {
    const fetched = categoriesData?.categories;
    if (fetched && fetched.length > 0) {
      return fetched.filter((c) => c.isActive);
    }
    return DEFAULT_FALLBACK_CATEGORIES;
  }, [categoriesData]);

  const adminComboProducts = useMemo(() => {
    return combosData?.products?.filter((p) => p.isActive) || [];
  }, [combosData]);

  // Dynamic Mega Menu construction
  const megaMenus: Record<string, MegaMenuContent> = useMemo(() => {
    // 1. Build combos list strictly from admin panel combo products
    let comboItems: Array<{ title: string; description: string; href: string; badge?: string }> = [];
    let comboFeaturedCards: Array<{ title: string; description: string; href: string; image: string; badge: string }> = [];

    if (adminComboProducts.length > 0) {
      comboItems = adminComboProducts.map((p) => ({
        title: getLocalizedName(p, locale),
        description: getLocalizedDescription(p, locale) || (locale === 'ta' ? 'சிவகாசி நேரடி தீபாவளி காம்போ பேக்.' : 'Curated celebration combo package from Sivakasi.'),
        href: `/product/${p.slug}`,
        badge: formatCurrency(toNumber(p.sellingPrice)),
      }));

      comboFeaturedCards = adminComboProducts.slice(0, 2).map((p) => ({
        title: getLocalizedName(p, locale),
        description: getLocalizedDescription(p, locale) || (locale === 'ta' ? 'அனைத்து வகை பட்டாசுகளும் அடங்கிய சிறப்பு காம்போ பேக்.' : 'Festive celebration combo pack with assorted crackers.'),
        href: `/product/${p.slug}`,
        image: p.media?.[0]?.url || getCategory3DImage(p.name),
        badge: formatCurrency(toNumber(p.sellingPrice)),
      }));
    } else {
      comboItems = [
        {
          title: locale === 'ta' ? 'காம்போ பேக்குகள் விரைவில்' : 'Combos Coming Soon',
          description: locale === 'ta' ? 'நிர்வாகக் குழு உருவாக்கிய புதிய காம்போ தொகுப்புகள் இங்கு தோன்றும்.' : 'Custom combo packages created in the admin panel will appear here.',
          href: '/products',
          badge: locale === 'ta' ? 'பட்டியல்' : 'Catalog',
        },
      ];
      comboFeaturedCards = [
        {
          title: locale === 'ta' ? 'அனைத்து பட்டாசுகளையும் பார்க்க' : 'Explore All Crackers',
          description: locale === 'ta' ? 'எங்கள் நேரடி சிவகாசி பட்டாசு பட்டியலை முழுமையாக ஆராயுங்கள்.' : 'Browse our full catalog of premium Sivakasi fireworks.',
          href: '/products',
          image: '/images/3d/cat-family-packs.jpg',
          badge: locale === 'ta' ? 'சிவகாசி நேரடி' : 'Direct Sivakasi',
        },
      ];
    }

    return {
      categories: {
        id: 'categories',
        label: tNav('categories'),
        items: activeCategories.map((cat) => ({
          title: getLocalizedName(cat, locale),
          description: getLocalizedDescription(cat, locale) || (locale === 'ta' ? 'சிவகாசி தொழிற்சாலையிலிருந்து நேரடி பசுமை பட்டாசுகள்.' : 'Authentic factory-sealed crackers direct from Sivakasi.'),
          href: `/category/${cat.slug}`,
        })),
        featuredSectionTitle: tNav('featuredCollections'),
        featuredCards: activeCategories.slice(0, 2).map((cat) => ({
          title: `${getLocalizedName(cat, locale)}`,
          description: getLocalizedDescription(cat, locale) || (locale === 'ta' ? 'உயர்தர ஒளி, பிரகாசம் மற்றும் பாதுகாப்பிற்கு உத்தரவாதம்.' : 'Tested for supreme sparkle, vibrant colors, and safety.'),
          href: `/category/${cat.slug}`,
          image: cat.image || getCategory3DImage(cat.name),
          badge: locale === 'ta' ? 'சிவகாசி நேரடி' : 'Direct Sivakasi',
        })),
      },
      combos: {
        id: 'combos',
        label: tNav('combos'),
        items: comboItems,
        featuredSectionTitle: tNav('curatedCombos'),
        featuredCards: comboFeaturedCards,
      },
      about: {
        id: 'about',
        label: tNav('about'),
        items: [
          {
            title: locale === 'ta' ? 'பசுமை பட்டாசு சான்றிதழ்' : 'Green Crackers Certification',
            description: locale === 'ta' ? 'CSIR-NEERI தரநிலைகள், QR குறியீடு மற்றும் சுற்றுச்சூழல் பாதுகாப்பு.' : 'Understand CSIR-NEERI standards, QR code verification, and eco safety.',
            href: '/products?certified=green',
          },
          {
            title: locale === 'ta' ? 'பட்டாசு பாதுகாப்பு வழிகாட்டி' : 'Family Bursting Safety Guide',
            description: locale === 'ta' ? 'பாதுகாப்பு முன்னெச்சரிக்கைகள், நீர் வாளி ஏற்பாடு மற்றும் குழந்தை பாதுகாப்பு.' : 'Essential safety precautions, water bucket prep, and child supervision tips.',
            href: '/track-order',
          },
          {
            title: locale === 'ta' ? 'நேரடி சிவகாசி உத்தரவாதம்' : 'Direct From Sivakasi Guarantee',
            description: locale === 'ta' ? '100% புதிய உற்பத்தி தொகுப்பு, ஈரப்பதம் புகா பேக்கிங்.' : '100% fresh batch manufacturing, moisture-proof sealed packaging.',
            href: '/products',
          },
        ],
        featuredSectionTitle: locale === 'ta' ? 'பாதுகாப்பு & நம்பிக்கை' : 'Safety & Trust',
        featuredCards: [
          {
            title: locale === 'ta' ? 'சான்றளிக்கப்பட்ட பசுமை பட்டாசு' : 'Certified Safe Green Fireworks',
            description: locale === 'ta' ? 'புகையைக் குறைத்து பிரகாசமான வண்ணங்களை வழங்கும் அரசு அங்கீகரித்த தயாரிப்பு.' : 'Reduced particulate emissions without compromising on sparkle and sound.',
            href: '/products?certified=green',
            image: '/images/3d/usp-sivakasi-direct.jpg',
            badge: locale === 'ta' ? '100% சான்றளிக்கப்பட்டது' : '100% Certified',
          },
          {
            title: locale === 'ta' ? 'பாதுகாப்பான பார்சல் போக்குவரத்து' : 'Doorstep Transport & Dispatch',
            description: locale === 'ta' ? 'சட்டப்பூர்வ லாரி சர்வீஸ், LR எண்கள் மற்றும் SMS தகவல் வசதி.' : 'Compliant logistics with real-time SMS and WhatsApp dispatch notifications.',
            href: '/track-order',
            image: '/images/3d/usp-flexible-dispatch.jpg',
            badge: locale === 'ta' ? 'விரைவு பார்சல்' : 'Fast Dispatch',
          },
        ],
      },
    };
  }, [activeCategories, adminComboProducts, locale, tNav]);

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
    }, 200);
  };

  const currentMegaMenu = activeMenu ? megaMenus[activeMenu] : null;

  return (
    <div
      ref={navContainerRef}
      className="sticky top-0 z-50 w-full pt-3 px-3 sm:px-6 lg:px-10 xl:px-12 pointer-events-auto transition-all duration-300"
      onMouseLeave={handleMouseLeave}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="w-full relative">
        {/* Floating Frosted Pill Bar with White Glassmorphism */}
        <header className="relative h-16 sm:h-[72px] px-3.5 sm:px-6 rounded-full bg-white/95 backdrop-blur-md border border-neutral-200/90 text-neutral-900 shadow-sm grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 transition-all duration-300">
          {/* Left Column: Capsule Pill Navigation Links & Mobile Hamburger */}
          <div className="flex items-center justify-start min-w-0">
            {/* Mobile Menu Hamburger Button */}
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="h-12 w-12 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-900 transition-colors flex items-center justify-center cursor-pointer shadow-xs active:scale-95"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>

            {/* Desktop Capsule Pill Navigation (Light Sub-Capsule) */}
            <nav className="hidden md:inline-flex items-center gap-1.5 bg-neutral-100/90 p-1.5 rounded-full border border-neutral-200/60 shadow-inner shrink-0">
              <Link
                href="/products"
                className={`px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  pathname === '/products' && !activeMenu
                    ? 'bg-white text-neutral-950 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-950 hover:bg-white/80'
                }`}
              >
                {tNav('catalog')}
              </Link>

              {Object.keys(megaMenus).map((key) => {
                const menu = megaMenus[key];
                const isHovered = activeMenu === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onMouseEnter={() => handleMouseEnter(key)}
                    onClick={() => setActiveMenu(activeMenu === key ? null : key)}
                    className={`px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap ${
                      isHovered
                        ? 'bg-white text-neutral-950 shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-950 hover:bg-white/80'
                    }`}
                    aria-expanded={isHovered}
                  >
                    <span>{menu.label}</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isHovered ? 'rotate-180 text-neutral-950' : 'text-neutral-400'
                      }`}
                    />
                  </button>
                );
              })}

              <Link
                href="/track-order"
                className={`px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  pathname === '/track-order' && !activeMenu
                    ? 'bg-white text-neutral-950 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-950 hover:bg-white/80'
                }`}
              >
                {tNav('trackOrder')}
              </Link>
            </nav>
          </div>

          {/* Center Column: Brand Logo */}
          <div className="flex items-center justify-center px-1 shrink-0">
            <Link href="/" className="flex items-center gap-2 group py-1">
              <BrandLogo className="h-10 sm:h-11 md:h-12 max-h-12 w-auto transition-transform duration-200 group-hover:scale-105 drop-shadow-sm shrink-0" />
            </Link>
          </div>

          {/* Right Column: Action Buttons (Language Selector + Search + Download/Price List + Bag) */}
          <div className="flex items-center justify-end gap-2 sm:gap-2.5 shrink-0">
            {/* Language Selector */}
            <LanguageSelector />

            {/* Quick Search Button */}
            <Link
              href="/search"
              className="hidden lg:inline-flex items-center gap-2 h-12 px-4 rounded-full bg-neutral-100/90 hover:bg-neutral-200/90 text-neutral-700 hover:text-neutral-950 text-xs sm:text-sm font-semibold transition-all shadow-xs whitespace-nowrap active:scale-95"
            >
              <Search className="h-4 w-4 text-neutral-400" />
              <span>{tCommon('search')}</span>
            </Link>

            <Link
              href="/search"
              className="lg:hidden h-12 w-12 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-900 hover:bg-neutral-200 transition-colors shadow-xs active:scale-95"
              aria-label={tCommon('search')}
            >
              <Search className="h-4.5 w-4.5" />
            </Link>

            {/* Download Price List Pill Button */}
            <Link
              href="/products"
              className="hidden sm:inline-flex items-center gap-2 h-12 px-4 sm:px-5 rounded-full bg-neutral-100/90 hover:bg-neutral-200/90 text-neutral-900 text-xs sm:text-sm font-bold transition-all active:scale-95 shadow-xs whitespace-nowrap"
            >
              <Download className="h-4 w-4 text-neutral-700" />
              <span>{tNav('priceList')}</span>
            </Link>

            {/* Shopping Bag Pill Button */}
            <Link
              href="/cart"
              className="relative h-12 px-4 sm:px-5 rounded-full bg-neutral-950 text-white text-xs sm:text-sm font-bold hover:bg-neutral-800 active:scale-95 transition-all flex items-center gap-2 shadow-md whitespace-nowrap cursor-pointer justify-center"
              aria-label={`${tNav('bag')} with ${displayCount} items`}
            >
              <ShoppingBag className="h-4.5 w-4.5" />
              <span className="hidden sm:inline">{tNav('bag')}</span>
              {displayCount > 0 && (
                <span className="h-5 min-w-5 px-1.5 rounded-full bg-white text-neutral-950 text-[11px] font-bold flex items-center justify-center shadow-xs">
                  {displayCount > 99 ? '99+' : displayCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Mega Dropdown Panel */}
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
            <div className="rounded-[32px] sm:rounded-[36px] bg-white text-neutral-900 shadow-2xl border border-neutral-200/90 p-6 sm:p-8 overflow-hidden backdrop-blur-xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: List of Categories or Combos */}
                <div className="lg:col-span-6 space-y-4">
                  <div
                    className={`grid ${
                      currentMegaMenu.items.length > 3
                        ? 'grid-cols-1 sm:grid-cols-2 gap-2.5'
                        : 'grid-cols-1 space-y-2'
                    } max-h-[380px] overflow-y-auto pr-1`}
                  >
                    {currentMegaMenu.items.map((item, idx) => (
                      <Link
                        key={idx}
                        href={item.href}
                        onClick={() => setActiveMenu(null)}
                        className="group block space-y-1 transition-all p-3 rounded-[20px] hover:bg-neutral-50"
                      >
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-neutral-900 group-hover:text-neutral-950 transition-colors line-clamp-1">
                            {item.title}
                          </h3>
                          {item.badge && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-neutral-100 text-neutral-800 uppercase tracking-wider shrink-0 font-mono">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 group-hover:text-neutral-700 leading-relaxed transition-colors line-clamp-2">
                          {item.description}
                        </p>
                      </Link>
                    ))}
                  </div>

                  {currentMegaMenu.id === 'categories' && (
                    <div className="pt-2 border-t border-neutral-100">
                      <Link
                        href="/products"
                        onClick={() => setActiveMenu(null)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-950 hover:underline"
                      >
                        <span>{tNav('browseAllCategories')}</span>
                        <span>→</span>
                      </Link>
                    </div>
                  )}

                  {currentMegaMenu.id === 'combos' && (
                    <div className="pt-2 border-t border-neutral-100">
                      <Link
                        href="/products?featured=true"
                        onClick={() => setActiveMenu(null)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-950 hover:underline"
                      >
                        <span>{tNav('viewAllCombos')}</span>
                        <span>→</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Right Column: Featured Cards */}
                <div className="lg:col-span-6 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    {currentMegaMenu.featuredSectionTitle}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentMegaMenu.featuredCards.map((card, idx) => (
                      <Link
                        key={idx}
                        href={card.href}
                        onClick={() => setActiveMenu(null)}
                        className="group flex flex-col space-y-3 cursor-pointer p-3 -m-3 rounded-[24px] hover:bg-neutral-50 transition-all"
                      >
                        {/* Thumbnail Image Container */}
                        <div className="relative aspect-[16/10] w-full rounded-[20px] sm:rounded-[22px] overflow-hidden bg-neutral-100 border border-neutral-200/80 shadow-xs">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={card.image}
                            alt={card.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute top-2.5 left-2.5">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-950/85 text-white backdrop-blur-md uppercase tracking-wider shadow-sm font-mono">
                              {card.badge}
                            </span>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h5 className="font-bold text-xs sm:text-sm text-neutral-900 group-hover:text-neutral-950 transition-colors line-clamp-2 leading-snug">
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

        {/* Mobile Slide-down Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 pt-2 z-50 animate-in fade-in duration-200">
            <div className="rounded-[28px] sm:rounded-[32px] bg-white text-neutral-900 border border-neutral-200/90 p-5 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-1">
                {/* Mobile Language Switcher Header */}
                <div className="pb-3 border-b border-neutral-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    {locale === 'ta' ? 'மொழி / Language' : 'Language / மொழி'}
                  </span>
                  <LanguageSelector variant="inline" />
                </div>

                <Link
                  href="/products"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-full text-sm font-bold hover:bg-neutral-100 text-neutral-900 transition-colors"
                >
                  {tNav('catalog')}
                </Link>

                {/* Combos from Admin Panel */}
                {adminComboProducts.length > 0 && (
                  <div className="pt-2 pb-1">
                    <span className="px-4 text-[11px] font-bold uppercase tracking-wider text-amber-700 block mb-1">
                      {tNav('curatedCombos')}
                    </span>
                    <div className="space-y-1">
                      {adminComboProducts.map((p) => (
                        <Link
                          key={p.id}
                          href={`/product/${p.slug}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-neutral-800 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
                        >
                          <span className="truncate">{getLocalizedName(p, locale)}</span>
                          <span className="text-[11px] font-mono font-bold text-neutral-950 shrink-0 ml-2">
                            {formatCurrency(toNumber(p.sellingPrice))}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Categories from Admin Panel */}
                {activeCategories.length > 0 && (
                  <div className="pt-2 pb-1 border-t border-neutral-100">
                    <span className="px-4 text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                      {tNav('categories')}
                    </span>
                    <div className="grid grid-cols-2 gap-1">
                      {activeCategories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/category/${cat.slug}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block px-3 py-2 rounded-xl text-xs font-semibold text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 transition-colors truncate"
                        >
                          {getLocalizedName(cat, locale)}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-neutral-100 space-y-1">
                  <Link
                    href="/products?certified=green"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 rounded-full text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                  >
                    {locale === 'ta' ? 'பசுமை பட்டாசு சான்றிதழ்' : 'Green Certified Fireworks'}
                  </Link>
                  <Link
                    href="/track-order"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 rounded-full text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                  >
                    {tNav('trackOrder')}
                  </Link>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-3">
                <Link
                  href="/products"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-neutral-100 hover:bg-neutral-200 text-xs sm:text-sm font-bold text-neutral-900 shadow-xs transition-all active:scale-95 flex-1"
                >
                  <Download className="h-4 w-4 text-neutral-700" />
                  <span>{tNav('priceList')}</span>
                </Link>

                <Link
                  href="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-neutral-950 hover:bg-neutral-800 text-xs sm:text-sm font-bold text-white shadow-md transition-all active:scale-95 flex-1"
                >
                  <ShoppingBag className="h-4.5 w-4.5" />
                  <span>{tNav('bag')} ({displayCount})</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
