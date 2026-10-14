'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from '@/components/ui/link';
import {
  Zap,
  Search,
  Filter,
  ArrowUpDown,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  X,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Package,
  LayoutGrid,
  Check,
} from 'lucide-react';
import { QuickCartWidget } from '@/components/store/quick-cart-widget';
import { useCart, useCartItemQuantity } from '@/hooks/use-cart';
import { useLocale, useTranslations, I18nProvider } from '@/lib/i18n/context';
import { getLocalizedName } from '@/lib/i18n/formatters';
import { formatCurrency, toNumber } from '@/lib/utils/format';
import { ProductVisualPlaceholder } from '@/components/ui/category-icon';
import { APP_CONFIG } from '@/lib/constants/config';
import { toast } from '@/lib/toast';

export interface QuickOrderProduct {
  id: number;
  name: string;
  nameTa?: string | null;
  slug: string;
  sku?: string | null;
  piecesPerBox?: number | null;
  boxContent?: number | null;
  contentUnit?: string | null;
  mrp: string | number;
  sellingPrice: string | number;
  discountPercent?: number | null;
  stockQuantity: number;
  isFeatured?: boolean;
  isBestseller?: boolean;
  isCombo?: boolean;
  category?: {
    id: number;
    name: string;
    nameTa?: string | null;
    slug: string;
  } | null;
  media?: Array<{ url: string; alt?: string | null }>;
}

export interface QuickOrderCategory {
  id: number;
  name: string;
  nameTa?: string | null;
  slug: string;
}

interface QuickOrderContentProps {
  products: QuickOrderProduct[];
  categories: QuickOrderCategory[];
  minOrderValue?: number;
  locale?: 'en' | 'ta';
}

export function QuickOrderContent({
  products,
  categories,
  minOrderValue = 2000,
  locale: propLocale,
}: QuickOrderContentProps) {
  const detectedLocale = useLocale();
  const locale = (propLocale && (propLocale === 'ta' || propLocale === 'en') ? propLocale : detectedLocale) as 'en' | 'ta';
  const tNav = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const tCat = useTranslations('categories');
  const tProd = useTranslations('products');

  const { addItem, updateQuantity, removeItem } = useCart();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('default');

  // Dropdown Open States & Refs
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setIsCategoryOpen(false);
      }
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
        setIsFiltersOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCategoryOpen(false);
        setIsFiltersOpen(false);
        setIsSortOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Helper to determine if product is strictly a Combo or Gift Box
  const isComboItem = (p: QuickOrderProduct): boolean => {
    const catName = (p.category?.name || '').toLowerCase();
    const catSlug = (p.category?.slug || '').toLowerCase();
    return Boolean(
      p.isCombo ||
      catName === 'combo' ||
      catName === 'gift box' ||
      catName.includes('combo') ||
      catName.includes('gift') ||
      catSlug.includes('combo') ||
      catSlug.includes('gift')
    );
  };

  // Category counts computation
  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    map.set('all', products.length);
    let combos = 0;
    let bestseller = 0;
    products.forEach((p) => {
      if (isComboItem(p)) combos++;
      if (p.isBestseller) bestseller++;
      if (p.category?.slug) {
        map.set(p.category.slug, (map.get(p.category.slug) || 0) + 1);
      }
    });
    map.set('combos', combos);
    map.set('bestseller', bestseller);
    return map;
  }, [products]);

  // Label helpers matching the screenshot
  const activeCategoryLabel = useMemo(() => {
    if (selectedCategory === 'all') {
      const count = categoryCounts.get('all') || products.length;
      return `All Pro... (${count})`;
    }
    if (selectedCategory === 'combos') {
      const count = categoryCounts.get('combos') || 0;
      return `Combos (${count})`;
    }
    if (selectedCategory === 'bestseller') {
      const count = categoryCounts.get('bestseller') || 0;
      return `Bestseller (${count})`;
    }
    const cat = categories.find((c) => c.slug === selectedCategory);
    const name = cat ? getLocalizedName(cat, locale) : selectedCategory;
    const count = categoryCounts.get(selectedCategory) || 0;
    const shortName = name.length > 8 ? `${name.slice(0, 7)}...` : name;
    return `${shortName} (${count})`;
  }, [selectedCategory, categories, categoryCounts, products.length, locale]);

  const activeFilterLabel = useMemo(() => {
    switch (filterType) {
      case 'in_stock':
        return locale === 'ta' ? 'கையிருப்பு' : 'In Stock';
      case 'combos':
        return locale === 'ta' ? 'காம்போ' : 'Combos';
      case 'bestseller':
        return locale === 'ta' ? 'சிறந்தவை' : 'Bestsellers';
      case 'discounted':
        return locale === 'ta' ? 'தள்ளுபடி' : 'Discounted';
      default:
        return locale === 'ta' ? 'வடிகட்டி' : 'Filters';
    }
  }, [filterType, locale]);

  const activeSortLabel = useMemo(() => {
    switch (sortBy) {
      case 'price_asc':
        return locale === 'ta' ? 'குறைந்த விலை' : 'Price: Low';
      case 'price_desc':
        return locale === 'ta' ? 'உயர்ந்த விலை' : 'Price: High';
      case 'discount_desc':
        return locale === 'ta' ? 'தள்ளுபடி' : 'Discount';
      case 'name_asc':
        return locale === 'ta' ? 'பெயர்' : 'Name';
      default:
        return locale === 'ta' ? 'வரிசை' : 'Sort';
    }
  }, [sortBy, locale]);

  // Max discount calculation for the top badge
  const maxDiscountRate = useMemo(() => {
    let maxD = 0;
    products.forEach((p) => {
      const mrp = toNumber(p.mrp);
      const sp = toNumber(p.sellingPrice);
      if (mrp > sp) {
        const d = Math.round(((mrp - sp) / mrp) * 100);
        if (d > maxD) maxD = d;
      }
    });
    return maxD > 0 ? maxD : 80;
  }, [products]);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchTa = (p.nameTa || '').toLowerCase().includes(q);
          const matchSku = (p.sku || '').toLowerCase().includes(q);
          const matchCat = (p.category?.name || '').toLowerCase().includes(q);
          if (!matchName && !matchTa && !matchSku && !matchCat) return false;
        }

        // Category
        if (selectedCategory !== 'all') {
          if (selectedCategory === 'combos') {
            if (!isComboItem(p)) return false;
          } else if (selectedCategory === 'bestseller') {
            if (!p.isBestseller) return false;
          } else if (p.category?.slug !== selectedCategory) {
            return false;
          }
        }

        // Additional Filter Type
        if (filterType === 'in_stock' && p.stockQuantity <= 0) {
          return false;
        }
        if (filterType === 'combos' && !isComboItem(p)) {
          return false;
        }
        if (filterType === 'bestseller' && !p.isBestseller) {
          return false;
        }
        if (filterType === 'discounted') {
          const mrp = toNumber(p.mrp);
          const sp = toNumber(p.sellingPrice);
          if (mrp <= sp || ((mrp - sp) / mrp) * 100 < 40) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = toNumber(a.sellingPrice);
        const priceB = toNumber(b.sellingPrice);
        const mrpA = toNumber(a.mrp);
        const mrpB = toNumber(b.mrp);
        const discA = mrpA > priceA ? ((mrpA - priceA) / mrpA) * 100 : 0;
        const discB = mrpB > priceB ? ((mrpB - priceB) / mrpB) * 100 : 0;

        switch (sortBy) {
          case 'price_asc':
            return priceA - priceB;
          case 'price_desc':
            return priceB - priceA;
          case 'discount_desc':
            return discB - discA;
          case 'name_asc':
            return a.name.localeCompare(b.name);
          default:
            return 0; // Natural shop order
        }
      });
  }, [products, searchQuery, selectedCategory, filterType, sortBy]);

  const getHref = (path: string) => `/${locale}${path}`;

  return (
    <I18nProvider locale={locale}>
      <div className="w-full min-h-screen bg-[#f8f9fa] dark:bg-[#0c0c0c] text-neutral-900 dark:text-neutral-100 transition-colors duration-200 select-none pb-28 lg:pb-16">
      <div className="max-w-[1500px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6">

        {/* ── Top Header Banner: Quick Order & Discount Pill ── */}
        <div className="relative overflow-hidden rounded-[24px] sm:rounded-[32px] bg-gradient-to-r from-neutral-950 via-[#18181b] to-neutral-900 text-white p-5 sm:p-7 border border-neutral-800/80 shadow-md">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#e24000]/15 blur-3xl pointer-events-none rounded-full" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#b82e00] via-[#e24000] to-[#ff6d24] text-white text-xs sm:text-sm font-bold shadow-xs">
                  <Zap className="h-3.5 w-3.5 fill-white text-white" />
                  <span>{locale === 'ta' ? 'விரைவு ஆர்டர்' : 'Quick Order'}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  {locale === 'ta' ? `${maxDiscountRate}% வரை தள்ளுபடி` : `Up to ${maxDiscountRate}% OFF`}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-xs text-neutral-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  {locale === 'ta' ? '100% நேரடி சிவகாசி அசல்' : '100% Sivakasi Genuine'}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
                {locale === 'ta'
                  ? 'சிவகாசி பட்டாசுகள் விரைவு மொத்த ஆர்டர் பட்டியல்'
                  : `${APP_CONFIG.STORE_NAME} Wholesale Quick Order`}
              </h1>

              <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
                {locale === 'ta'
                  ? 'பட்டியலிலிருந்தே நேரடியாக அளவுகளைத் தேர்ந்தெடுக்கவும் — ஒவ்வொரு பக்கத்திற்கும் செல்ல வேண்டியதில்லை. தீபாவளி மற்றும் பண்டிகை மொத்த ஆர்டர்களுக்கு மிகவும் ஏற்றது.'
                  : 'Add quantities directly from the table — no need to visit each product page. Perfect for festival bulk and repeat orders.'}
              </p>
            </div>

            {/* Quick Summary Pill on Desktop */}
            <div className="hidden lg:flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-xs shrink-0">
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">
                  {locale === 'ta' ? 'பொருட்கள் எண்ணிக்கை' : 'Available Items'}
                </p>
                <p className="text-lg font-black text-white">
                  {filteredProducts.length} <span className="text-xs font-normal text-neutral-400">/ {products.length}</span>
                </p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">
                  {locale === 'ta' ? 'குறைந்தபட்ச ஆர்டர்' : 'Min Order'}
                </p>
                <p className="text-lg font-black text-amber-400">
                  {formatCurrency(minOrderValue)}
                </p>
              </div>
            </div>
          </div>
        </div>



        {/* ── Main Catalog View: Category Sidebar + Product Table + Bag Sidebar ── */}
        <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 items-start">

          {/* ═══════════════════════════════════════════════════
              LEFT COLUMN: Category Sidebar (Same as Products Page)
             ═══════════════════════════════════════════════════ */}
          <aside className="hidden lg:block w-56 shrink-0 bg-white dark:bg-[#141414] dark:border dark:border-[#282828] rounded-[28px] sm:rounded-[32px] p-5 sticky top-24 shadow-sm dark:shadow-none">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-neutral-100 dark:border-[#282828] font-bold text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              <Filter className="h-3.5 w-3.5 text-[#e24000]" />
              <span>{locale === 'ta' ? 'வகைகள்' : 'Categories'}</span>
            </div>

            <ul className="space-y-1.5">
              <li>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`block w-full text-left px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[#202020] hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {tNav('allProducts')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('combos')}
                  className={`block w-full text-left px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategory === 'combos'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[#202020] hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {tNav('combos')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('bestseller')}
                  className={`block w-full text-left px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategory === 'bestseller'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[#202020] hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {tProd('bestseller')}
                </button>
              </li>

              <li className="pt-2 pb-1 border-t border-neutral-100 dark:border-[#282828] my-2 text-[10px] uppercase font-bold text-neutral-400 tracking-wider px-3">
                {locale === 'ta' ? 'வகைகள்' : 'Categories'}
              </li>

              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`block w-full text-left px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      selectedCategory === cat.slug
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[#202020] hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    {getLocalizedName(cat, locale)}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* ═══════════════════════════════════════════════════
              CENTER COLUMN: Search, Controls & Product Table
             ═══════════════════════════════════════════════════ */}
          <main className="flex-1 min-w-0 w-full space-y-4">

            {/* ── Compact Controls Toolbar (Matches Screenshot) ── */}
            <div className="space-y-2.5">
              {/* Row 1: Search Bar with live matching product count */}
              <div className="relative w-full h-12 rounded-2xl bg-white dark:bg-[#141414] border border-neutral-200/90 dark:border-[#282828] flex items-center px-3.5 shadow-2xs focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/15 transition-all">
                <Search className="h-4 w-4 text-neutral-400 shrink-0 select-none mr-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    locale === 'ta'
                      ? 'பட்டாசு அல்லது குறியீட்டைத் தேடுங்கள்...'
                      : 'Search products...'
                  }
                  className="w-full bg-transparent text-xs sm:text-sm text-foreground placeholder:text-neutral-400 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer mr-2 shrink-0"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <span className="text-xs text-neutral-400 shrink-0 select-none ml-2 font-normal">
                  {filteredProducts.length} {locale === 'ta' ? 'பட்டாசுகள்' : 'products'}
                </span>
              </div>

              {/* Row 2: Three compact dropdown pill buttons */}
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                {/* 1. Category Dropdown Button */}
                <div ref={categoryRef} className="relative min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCategoryOpen((prev) => !prev);
                      setIsFiltersOpen(false);
                      setIsSortOpen(false);
                    }}
                    aria-expanded={isCategoryOpen}
                    className="w-full h-10 px-2.5 sm:px-3.5 rounded-2xl border border-neutral-200/90 dark:border-[#282828] bg-white dark:bg-[#141414] hover:bg-neutral-50 dark:hover:bg-[#1a1a1a] flex items-center justify-between gap-1 text-xs font-semibold text-neutral-800 dark:text-neutral-200 shadow-2xs cursor-pointer select-none transition-all"
                  >
                    <div className="flex items-center gap-1.5 min-w-0 truncate">
                      <LayoutGrid className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-neutral-500 dark:text-neutral-400 shrink-0" />
                      <span className="truncate">{activeCategoryLabel}</span>
                    </div>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-neutral-400 shrink-0 transition-transform duration-200 ${
                        isCategoryOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isCategoryOpen && (
                    <div className="absolute left-0 top-full mt-2 w-60 sm:w-64 max-h-80 overflow-y-auto no-scrollbar bg-white dark:bg-[#141414] rounded-2xl p-1.5 shadow-2xl border border-neutral-200/80 dark:border-[#282828] z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-left">
                      <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-neutral-400 uppercase border-b border-neutral-100 dark:border-[#282828]">
                        {locale === 'ta' ? 'வகையைத் தேர்ந்தெடுக்கவும்' : 'Select Category'}
                      </div>
                      <div className="py-1 space-y-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory('all');
                            setIsCategoryOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-xs rounded-xl flex items-center justify-between font-medium cursor-pointer ${
                            selectedCategory === 'all'
                              ? 'bg-amber-400 text-neutral-950 font-bold'
                              : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#202020]'
                          }`}
                        >
                          <span>{locale === 'ta' ? 'அனைத்து பட்டாசுகள்' : 'All Products'}</span>
                          <span className="text-[11px] opacity-75">({products.length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory('combos');
                            setIsCategoryOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-xs rounded-xl flex items-center justify-between font-medium cursor-pointer ${
                            selectedCategory === 'combos'
                              ? 'bg-amber-400 text-neutral-950 font-bold'
                              : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#202020]'
                          }`}
                        >
                          <span>{tNav('combos')}</span>
                          <span className="text-[11px] opacity-75">({categoryCounts.get('combos') || 0})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory('bestseller');
                            setIsCategoryOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-xs rounded-xl flex items-center justify-between font-medium cursor-pointer ${
                            selectedCategory === 'bestseller'
                              ? 'bg-amber-400 text-neutral-950 font-bold'
                              : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#202020]'
                          }`}
                        >
                          <span>{tProd('bestseller')}</span>
                          <span className="text-[11px] opacity-75">({categoryCounts.get('bestseller') || 0})</span>
                        </button>

                        <div className="border-t border-neutral-100 dark:border-[#282828] my-1" />

                        {categories.map((c) => {
                          const isSelected = selectedCategory === c.slug;
                          const count = categoryCounts.get(c.slug) || 0;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(c.slug);
                                setIsCategoryOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-xs rounded-xl flex items-center justify-between font-medium cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-400 text-neutral-950 font-bold'
                                  : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#202020]'
                              }`}
                            >
                              <span className="truncate">{getLocalizedName(c, locale)}</span>
                              <span className="text-[11px] opacity-75 shrink-0 ml-2">({count})</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Filters Dropdown Button */}
                <div ref={filtersRef} className="relative min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFiltersOpen((prev) => !prev);
                      setIsCategoryOpen(false);
                      setIsSortOpen(false);
                    }}
                    aria-expanded={isFiltersOpen}
                    className={`w-full h-10 px-2.5 sm:px-3.5 rounded-2xl border bg-white dark:bg-[#141414] hover:bg-neutral-50 dark:hover:bg-[#1a1a1a] flex items-center justify-between gap-1 text-xs font-semibold shadow-2xs cursor-pointer select-none transition-all ${
                      filterType !== 'all'
                        ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                        : 'border-neutral-200/90 dark:border-[#282828] text-neutral-800 dark:text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 truncate">
                      <Filter className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-neutral-500 dark:text-neutral-400 shrink-0" />
                      <span className="truncate">{activeFilterLabel}</span>
                    </div>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-neutral-400 shrink-0 transition-transform duration-200 ${
                        isFiltersOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isFiltersOpen && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-52 sm:w-56 bg-white dark:bg-[#141414] rounded-2xl p-1.5 shadow-2xl border border-neutral-200/80 dark:border-[#282828] z-50 animate-in fade-in zoom-in-95 duration-150 origin-top">
                      <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-neutral-400 uppercase border-b border-neutral-100 dark:border-[#282828]">
                        {locale === 'ta' ? 'வடிகட்டிகள்' : 'Filter Products'}
                      </div>
                      <div className="py-1 space-y-0.5">
                        {[
                          { id: 'all', label: locale === 'ta' ? 'அனைத்து பட்டாசுகள்' : 'All Products' },
                          { id: 'in_stock', label: locale === 'ta' ? 'கையிருப்பில் மட்டும்' : 'In Stock Only' },
                          { id: 'combos', label: locale === 'ta' ? 'காம்போ தொகுப்புகள்' : 'Combos & Gift Packs' },
                          { id: 'bestseller', label: locale === 'ta' ? 'அதிகம் விற்பனையானவை' : 'Festive Bestsellers' },
                          { id: 'discounted', label: locale === 'ta' ? 'அதிக தள்ளுபடி (>40%)' : 'Big Discounts (>40%)' },
                        ].map((opt) => {
                          const isSelected = filterType === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setFilterType(opt.id);
                                setIsFiltersOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-xs rounded-xl flex items-center justify-between font-medium cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-400 text-neutral-950 font-bold'
                                  : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#202020]'
                              }`}
                            >
                              <span>{opt.label}</span>
                              {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Sort Dropdown Button */}
                <div ref={sortRef} className="relative min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSortOpen((prev) => !prev);
                      setIsCategoryOpen(false);
                      setIsFiltersOpen(false);
                    }}
                    aria-expanded={isSortOpen}
                    className="w-full h-10 px-2.5 sm:px-3.5 rounded-2xl border border-neutral-200/90 dark:border-[#282828] bg-white dark:bg-[#141414] hover:bg-neutral-50 dark:hover:bg-[#1a1a1a] flex items-center justify-between gap-1 text-xs font-semibold text-neutral-800 dark:text-neutral-200 shadow-2xs cursor-pointer select-none transition-all"
                  >
                    <div className="flex items-center gap-1.5 min-w-0 truncate">
                      <ArrowUpDown className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-neutral-500 dark:text-neutral-400 shrink-0" />
                      <span className="truncate">{activeSortLabel}</span>
                    </div>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-neutral-400 shrink-0 transition-transform duration-200 ${
                        isSortOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isSortOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 sm:w-56 bg-white dark:bg-[#141414] rounded-2xl p-1.5 shadow-2xl border border-neutral-200/80 dark:border-[#282828] z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right">
                      <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-neutral-400 uppercase border-b border-neutral-100 dark:border-[#282828]">
                        {locale === 'ta' ? 'வரிசைப்படுத்து' : 'Sort By'}
                      </div>
                      <div className="py-1 space-y-0.5">
                        {[
                          { id: 'default', label: locale === 'ta' ? 'இயல்பு வரிசை' : 'Default Order' },
                          { id: 'price_asc', label: locale === 'ta' ? 'விலை: குறைந்ததிலிருந்து' : 'Price: Low to High' },
                          { id: 'price_desc', label: locale === 'ta' ? 'விலை: உயர்ந்ததிலிருந்து' : 'Price: High to Low' },
                          { id: 'discount_desc', label: locale === 'ta' ? 'அதிக தள்ளுபடி' : 'Highest Discount' },
                          { id: 'name_asc', label: locale === 'ta' ? 'பெயர்: A - Z' : 'Name: A to Z' },
                        ].map((opt) => {
                          const isSelected = sortBy === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setSortBy(opt.id);
                                setIsSortOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-xs rounded-xl flex items-center justify-between font-medium cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-400 text-neutral-950 font-bold'
                                  : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#202020]'
                              }`}
                            >
                              <span>{opt.label}</span>
                              {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Thin Divider Line (Matches Screenshot) */}
              <div className="border-b border-neutral-200/80 dark:border-[#282828] pt-1" />
            </div>

            {/* ── Table View on Desktop / Cards on Mobile ── */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white dark:bg-[#141414] border border-neutral-200/90 dark:border-[#242424] rounded-[24px] p-12 text-center space-y-3">
                <Package className="h-10 w-10 text-neutral-400 mx-auto stroke-[1.5]" />
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  {locale === 'ta' ? 'பட்டாசுகள் கிடைக்கவில்லை' : 'No products match your criteria'}
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  {locale === 'ta'
                    ? 'வேறு தேடல் அல்லது வடிகட்டியை மாற்றி முயற்சிக்கவும்.'
                    : 'Try clearing some filters or searching with a different keyword.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                    setSortBy('default');
                  }}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#e24000] text-white text-xs font-bold hover:bg-[#c93600] transition-colors cursor-pointer"
                >
                  {locale === 'ta' ? 'அனைத்து பட்டாசுகளையும் காட்டு' : 'Show All Fireworks'}
                </button>
              </div>
            ) : (
              <>
                {/* ── Desktop Quick Order Table ── */}
                <div className="hidden md:block bg-white dark:bg-[#141414] border border-neutral-200/90 dark:border-[#242424] rounded-[24px] shadow-xs overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-[#242424] bg-neutral-50/80 dark:bg-[#181818] text-[11px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        <th className="py-3 px-4 w-[38%]">{locale === 'ta' ? 'தயாரிப்பு' : 'PRODUCT'}</th>
                        <th className="py-3 px-3 w-[16%]">{locale === 'ta' ? 'விவரம்' : 'LABEL'}</th>
                        <th className="py-3 px-3 w-[16%]">{locale === 'ta' ? 'விலை' : 'PRICE'}</th>
                        <th className="py-3 px-3 w-[18%] text-center">{locale === 'ta' ? 'அளவு' : 'QUANTITY'}</th>
                        <th className="py-3 px-4 w-[12%] text-right">{locale === 'ta' ? 'மொத்தம்' : 'TOTAL'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-[#202020] text-xs sm:text-sm">
                      {filteredProducts.map((p) => {
                        return (
                          <TableRow
                            key={p.id}
                            product={p}
                            locale={locale}
                            addItem={addItem}
                            updateQuantity={updateQuantity}
                            removeItem={removeItem}
                          />
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ── Mobile Quick Order Card List ── */}
                <div className="md:hidden space-y-3">
                  {filteredProducts.map((p) => {
                    return (
                      <MobileCard
                        key={p.id}
                        product={p}
                        locale={locale}
                        addItem={addItem}
                        updateQuantity={updateQuantity}
                        removeItem={removeItem}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </main>

          {/* ═══════════════════════════════════════════════════
              RIGHT COLUMN: Bag Section (Same as Products Page)
             ═══════════════════════════════════════════════════ */}
          <aside className="hidden xl:block w-80 shrink-0 sticky top-24 z-20">
            <QuickCartWidget />
          </aside>
        </div>
      </div>
    </div>
    </I18nProvider>
  );
}

// ─────────────────────────────────────────────────────────────
// Desktop Table Row Component with Live Cart Integration
// ─────────────────────────────────────────────────────────────
interface TableRowProps {
  product: QuickOrderProduct;
  locale: 'en' | 'ta';
  addItem: (item: any) => void;
  updateQuantity: (id: number, qty: number) => void;
  removeItem: (id: number) => void;
}

function TableRow({ product, locale, addItem, updateQuantity, removeItem }: TableRowProps) {
  const quantity = useCartItemQuantity(product.id);
  const mrp = toNumber(product.mrp);
  const price = toNumber(product.sellingPrice);
  const savings = mrp > price ? mrp - price : 0;
  const isOutOfStock = product.stockQuantity <= 0;
  const lineTotal = quantity * price;

  const img = product.media?.[0]?.url || null;
  const displayName = getLocalizedName(product, locale);
  const categoryName = getLocalizedName(product.category, locale);

  const labelText = product.piecesPerBox
    ? `${product.piecesPerBox} ${product.contentUnit || 'Pcs'}`
    : categoryName || '—';

  return (
    <tr className="hover:bg-neutral-50/80 dark:hover:bg-[#181818]/60 transition-colors group">
      {/* Product Column */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0 border border-neutral-200/60 dark:border-neutral-700/60">
            {img ? (
              <img
                src={img}
                alt={displayName}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              <ProductVisualPlaceholder name={product.name} className="h-full w-full" />
            )}
          </div>
          <div className="min-w-0">
            <Link
              href={`/${locale}/product/${product.slug}`}
              className="font-bold text-neutral-900 dark:text-white hover:text-[#e24000] dark:hover:text-[#ff6d24] transition-colors truncate block"
            >
              {displayName}
            </Link>
            <div className="flex items-center gap-2 mt-0.5">
              {categoryName && (
                <span className="text-[11px] text-neutral-400">
                  {categoryName}
                </span>
              )}
              {isOutOfStock && (
                <span className="text-[10px] font-bold text-red-500 uppercase">
                  {locale === 'ta' ? 'முடிந்தது' : 'Out of Stock'}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Label / Pack Specification */}
      <td className="py-3 px-3 text-neutral-600 dark:text-neutral-400 font-medium text-xs">
        {labelText}
      </td>

      {/* Price Column */}
      <td className="py-3 px-3">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <span className="font-extrabold text-amber-500 dark:text-amber-400 text-sm sm:text-base">
              {formatCurrency(price)}
            </span>
            {mrp > price && (
              <span className="text-xs text-neutral-400 line-through">
                {formatCurrency(mrp)}
              </span>
            )}
          </div>
          {savings > 0 && (
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              {locale === 'ta' ? `சேமிப்பு ${formatCurrency(savings)}` : `You save ${formatCurrency(savings)}`}
            </span>
          )}
        </div>
      </td>

      {/* Quantity Stepper Column */}
      <td className="py-3 px-3 text-center">
        {isOutOfStock ? (
          <span className="text-xs font-bold text-neutral-400">
            {locale === 'ta' ? 'கையிருப்பில் இல்லை' : 'Unavailable'}
          </span>
        ) : quantity === 0 ? (
          <button
            type="button"
            onClick={() => {
              addItem({
                productId: product.id,
                name: product.name,
                nameTa: product.nameTa,
                slug: product.slug,
                image: img,
                mrp,
                sellingPrice: price,
                maxStock: product.stockQuantity || 100,
                quantity: 1,
              });
              toast.success(
                locale === 'ta'
                  ? `${displayName} உங்கள் பையில் சேர்க்கப்பட்டது!`
                  : `${displayName} added to cart`
              );
            }}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs hover:shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{locale === 'ta' ? 'சேர்' : 'Add'}</span>
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full border border-neutral-200 dark:border-neutral-700 px-2 py-1 shadow-2xs">
            <button
              type="button"
              onClick={() => updateQuantity(product.id, quantity - 1)}
              className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-white dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition-colors cursor-pointer"
              aria-label="Decrease quantity"
            >
              {quantity === 1 ? <Trash2 className="h-3 w-3 text-red-500" /> : <Minus className="h-3 w-3" />}
            </button>
            <input
              type="number"
              min="0"
              max={product.stockQuantity || 100}
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) updateQuantity(product.id, Math.max(0, val));
              }}
              className="w-8 text-center text-xs font-black bg-transparent text-neutral-900 dark:text-white focus:outline-none"
            />
            <button
              type="button"
              onClick={() => updateQuantity(product.id, quantity + 1)}
              className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-white dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition-colors cursor-pointer"
              aria-label="Increase quantity"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        )}
      </td>

      {/* Total Column */}
      <td className="py-3 px-4 text-right">
        <span className={`font-black text-xs sm:text-sm ${lineTotal > 0 ? 'text-amber-500' : 'text-neutral-400'}`}>
          {formatCurrency(lineTotal)}
        </span>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────
// Mobile Card Component with Responsive Stepper
// ─────────────────────────────────────────────────────────────
interface MobileCardProps {
  product: QuickOrderProduct;
  locale: 'en' | 'ta';
  addItem: (item: any) => void;
  updateQuantity: (id: number, qty: number) => void;
  removeItem: (id: number) => void;
}

function MobileCard({ product, locale, addItem, updateQuantity, removeItem }: MobileCardProps) {
  const quantity = useCartItemQuantity(product.id);
  const mrp = toNumber(product.mrp);
  const price = toNumber(product.sellingPrice);
  const savings = mrp > price ? mrp - price : 0;
  const isOutOfStock = product.stockQuantity <= 0;
  const lineTotal = quantity * price;

  const img = product.media?.[0]?.url || null;
  const displayName = getLocalizedName(product, locale);
  const categoryName = getLocalizedName(product.category, locale);

  return (
    <div className="bg-white dark:bg-[#141414] border border-neutral-200/90 dark:border-[#242424] rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
      {/* Thumbnail */}
      <div className="h-16 w-16 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0 border border-neutral-200/60 dark:border-neutral-700/60">
        {img ? (
          <img src={img} alt={displayName} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <ProductVisualPlaceholder name={product.name} className="h-full w-full" />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/${locale}/product/${product.slug}`}
          className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white truncate block"
        >
          {displayName}
        </Link>
        {categoryName && (
          <p className="text-[10px] text-neutral-400 mt-0.5 truncate">{categoryName}</p>
        )}
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="font-black text-amber-500 text-sm">
            {formatCurrency(price)}
          </span>
          {mrp > price && (
            <span className="text-[10px] text-neutral-400 line-through">
              {formatCurrency(mrp)}
            </span>
          )}
        </div>
      </div>

      {/* Action / Stepper */}
      <div className="text-right shrink-0 space-y-1.5">
        <div className="text-[11px] font-bold text-neutral-400">
          {locale === 'ta' ? 'மொத்தம்' : 'Total'} <span className={lineTotal > 0 ? 'text-amber-500 font-black' : ''}>{formatCurrency(lineTotal)}</span>
        </div>

        {isOutOfStock ? (
          <span className="text-[10px] font-bold text-red-500 block">
            {locale === 'ta' ? 'முடிந்தது' : 'Out of Stock'}
          </span>
        ) : quantity === 0 ? (
          <button
            type="button"
            onClick={() => {
              addItem({
                productId: product.id,
                name: product.name,
                nameTa: product.nameTa,
                slug: product.slug,
                image: img,
                mrp,
                sellingPrice: price,
                maxStock: product.stockQuantity || 100,
                quantity: 1,
              });
              toast.success(
                locale === 'ta'
                  ? `${displayName} உங்கள் பையில் சேர்க்கப்பட்டது!`
                  : `${displayName} added to cart`
              );
            }}
            className="inline-flex items-center gap-1 h-8 px-3.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
          >
            <Plus className="h-3 w-3" />
            <span>{locale === 'ta' ? 'சேர்' : 'Add'}</span>
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full border border-neutral-200 dark:border-neutral-700 px-1.5 py-0.5">
            <button
              type="button"
              onClick={() => updateQuantity(product.id, quantity - 1)}
              className="h-6 w-6 flex items-center justify-center rounded-full text-neutral-700 dark:text-neutral-200"
            >
              {quantity === 1 ? <Trash2 className="h-3 w-3 text-red-500" /> : <Minus className="h-3 w-3" />}
            </button>
            <span className="w-5 text-center text-xs font-black">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => updateQuantity(product.id, quantity + 1)}
              className="h-6 w-6 flex items-center justify-center rounded-full text-neutral-700 dark:text-neutral-200"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
