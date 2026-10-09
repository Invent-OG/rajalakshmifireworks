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
} from 'lucide-react';
import { QuickCartWidget } from '@/components/store/quick-cart-widget';
import { useCart, useCartItemQuantity } from '@/hooks/use-cart';
import { useLocale, useTranslations } from '@/lib/i18n/context';
import { getLocalizedName } from '@/lib/i18n/formatters';
import { formatCurrency, toNumber } from '@/lib/utils/format';
import { ProductVisualPlaceholder } from '@/components/ui/category-icon';
import { APP_CONFIG } from '@/lib/constants/config';
import { toast } from 'sonner';

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
}

export function QuickOrderContent({
  products,
  categories,
  minOrderValue = 2000,
}: QuickOrderContentProps) {
  const locale = (useLocale() || 'en') as 'en' | 'ta';
  const tNav = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const tCat = useTranslations('categories');
  const tProd = useTranslations('products');

  const { addItem, updateQuantity, removeItem } = useCart();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('default');

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
            if (!p.isFeatured && !p.isCombo) return false;
          } else if (selectedCategory === 'bestseller') {
            if (!p.isBestseller) return false;
          } else if (p.category?.slug !== selectedCategory) {
            return false;
          }
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
  }, [products, searchQuery, selectedCategory, sortBy]);

  const getHref = (path: string) => `/${locale}${path}`;

  return (
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

        {/* Mobile Category Horizontal Scroll (Same as Products Page) */}
        <div className="lg:hidden flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-xs'
                : 'bg-white dark:bg-[#141414] text-neutral-600 dark:text-neutral-300 shadow-xs hover:bg-neutral-100 dark:hover:bg-[#202020] dark:border dark:border-[#282828]'
            }`}
          >
            {tCommon('all')}
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('combos')}
            className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
              selectedCategory === 'combos'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-xs'
                : 'bg-white dark:bg-[#141414] text-neutral-600 dark:text-neutral-300 shadow-xs hover:bg-neutral-100 dark:hover:bg-[#202020] dark:border dark:border-[#282828]'
            }`}
          >
            {tNav('combos')}
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('bestseller')}
            className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
              selectedCategory === 'bestseller'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-xs'
                : 'bg-white dark:bg-[#141414] text-neutral-600 dark:text-neutral-300 shadow-xs hover:bg-neutral-100 dark:hover:bg-[#202020] dark:border dark:border-[#282828]'
            }`}
          >
            {tProd('bestseller')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                selectedCategory === cat.slug
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-xs'
                  : 'bg-white dark:bg-[#141414] text-neutral-600 dark:text-neutral-300 shadow-xs hover:bg-neutral-100 dark:hover:bg-[#202020] dark:border dark:border-[#282828]'
              }`}
            >
              {getLocalizedName(cat, locale)}
            </button>
          ))}
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

            {/* Toolbar: Category Dropdown, Search Input, Sort Selector */}
            <div className="bg-white dark:bg-[#141414] border border-neutral-200/90 dark:border-[#242424] rounded-[24px] p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
              {/* Category Dropdown (Desktop & Mobile) */}
              <div className="relative w-full sm:w-auto shrink-0">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full sm:w-auto appearance-none bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 h-10 pl-3.5 pr-8 rounded-full focus:outline-none focus:border-[#e24000] cursor-pointer"
                >
                  <option value="all">
                    {locale === 'ta' ? `அனைத்து பட்டாசுகள் (${products.length})` : `All Fireworks (${products.length})`}
                  </option>
                  <option value="combos">
                    {tNav('combos')}
                  </option>
                  <option value="bestseller">
                    {tProd('bestseller')}
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {getLocalizedName(c, locale)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-neutral-400" />
              </div>

              {/* Search Bar with live matching count */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    locale === 'ta'
                      ? 'பட்டாசு பெயர் அல்லது குறியீட்டைத் தேடுங்கள்...'
                      : 'Search products by name or code...'
                  }
                  className="w-full h-10 pl-10 pr-24 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#e24000]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-neutral-400 pointer-events-none">
                  {filteredProducts.length} {locale === 'ta' ? 'முடிவுகள்' : 'items'}
                </span>
              </div>

              {/* Sort Dropdown */}
              <div className="relative w-full sm:w-auto shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto appearance-none bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 h-10 pl-3.5 pr-8 rounded-full focus:outline-none focus:border-[#e24000] cursor-pointer"
                >
                  <option value="default">{locale === 'ta' ? 'இயல்பு வரிசை' : 'Shop Order'}</option>
                  <option value="price_asc">{locale === 'ta' ? 'விலை: குறைந்ததிலிருந்து' : 'Price: Low to High'}</option>
                  <option value="price_desc">{locale === 'ta' ? 'விலை: உயர்ந்ததிலிருந்து' : 'Price: High to Low'}</option>
                  <option value="discount_desc">{locale === 'ta' ? 'அதிக தள்ளுபடி' : 'Highest Discount'}</option>
                  <option value="name_asc">{locale === 'ta' ? 'பெயர்: A - Z' : 'Name: A to Z'}</option>
                </select>
                <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none text-neutral-400" />
              </div>
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
                slug: product.slug,
                image: img,
                mrp,
                sellingPrice: price,
                maxStock: product.stockQuantity || 100,
                quantity: 1,
              });
              toast.success(`${displayName} added to cart`);
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
                slug: product.slug,
                image: img,
                mrp,
                sellingPrice: price,
                maxStock: product.stockQuantity || 100,
                quantity: 1,
              });
              toast.success(`${displayName} added to cart`);
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
