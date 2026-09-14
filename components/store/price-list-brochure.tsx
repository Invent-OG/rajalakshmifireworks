'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Download,
  Printer,
  FileSpreadsheet,
  Search,
  Sparkles,
  ShieldCheck,
  Truck,
  Phone,
  MessageSquare,
  MapPin,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
  ShoppingBag,
  Share2,
} from 'lucide-react';
import { BrandLogo } from '@/components/ui/brand-logo';
import { APP_CONFIG } from '@/lib/constants/config';
import { formatCurrency, toNumber } from '@/lib/utils/format';
import { useLocale, useTranslations } from '@/lib/i18n/context';
import { getLocalizedName, getLocalizedDescription } from '@/lib/i18n/formatters';
import { useCart } from '@/hooks/use-cart';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export interface PriceListProduct {
  id: number;
  name: string;
  nameTa?: string | null;
  slug: string;
  sku?: string | null;
  description?: string | null;
  descriptionTa?: string | null;
  mrp: string | number;
  sellingPrice: string | number;
  stockQuantity: number;
  isFeatured?: boolean;
  isBestseller?: boolean;
  isCombo?: boolean;
  categoryId?: number | null;
  category?: {
    id: number;
    name: string;
    nameTa?: string | null;
    slug: string;
  } | null;
  media?: Array<{ url: string }>;
}

export interface PriceListComboItem {
  id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    nameTa?: string | null;
    mrp: string | number;
    sellingPrice: string | number;
  };
}

export interface PriceListCombo {
  id: number;
  name: string;
  nameTa?: string | null;
  slug: string;
  description?: string | null;
  descriptionTa?: string | null;
  mrp: string | number;
  sellingPrice: string | number;
  media?: Array<{ url: string }>;
  comboItems?: PriceListComboItem[];
}

export interface PriceListCategory {
  id: number;
  name: string;
  nameTa?: string | null;
  slug: string;
  description?: string | null;
  products: PriceListProduct[];
}

interface PriceListBrochureProps {
  categories: PriceListCategory[];
  combos: PriceListCombo[];
}

export function PriceListBrochure({ categories, combos }: PriceListBrochureProps) {
  const locale = useLocale();
  const tNav = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const { addItem } = useCart();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const printableRef = useRef<HTMLDivElement>(null);

  // Filter categories and products based on selected pill & search
  const filteredCategories = useMemo(() => {
    return categories
      .map((cat) => {
        if (selectedCategory !== 'all' && selectedCategory !== 'combos' && cat.slug !== selectedCategory) {
          return null;
        }

        const matchingProducts = cat.products.filter((p) => {
          if (!searchQuery.trim()) return true;
          const q = searchQuery.toLowerCase();
          const nameEn = p.name.toLowerCase();
          const nameTa = (p.nameTa || '').toLowerCase();
          const sku = (p.sku || '').toLowerCase();
          return nameEn.includes(q) || nameTa.includes(q) || sku.includes(q);
        });

        if (matchingProducts.length === 0) return null;

        return {
          ...cat,
          products: matchingProducts,
        };
      })
      .filter(Boolean) as PriceListCategory[];
  }, [categories, selectedCategory, searchQuery]);

  // Filter combos
  const filteredCombos = useMemo(() => {
    if (selectedCategory !== 'all' && selectedCategory !== 'combos') return [];
    if (!searchQuery.trim()) return combos;

    const q = searchQuery.toLowerCase();
    return combos.filter((c) => {
      const nameEn = c.name.toLowerCase();
      const nameTa = (c.nameTa || '').toLowerCase();
      const descEn = (c.description || '').toLowerCase();
      return nameEn.includes(q) || nameTa.includes(q) || descEn.includes(q);
    });
  }, [combos, selectedCategory, searchQuery]);

  const totalProductsCount = useMemo(() => {
    return categories.reduce((acc, cat) => acc + cat.products.length, 0);
  }, [categories]);

  // Direct Print / Save as PDF handler
  const handlePrint = () => {
    window.print();
  };

  // Export to Excel Sheet (.xlsx)
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // 1. Cracker Products Worksheet
      const productRows: Array<Record<string, string | number>> = [];
      let sNo = 1;

      categories.forEach((cat) => {
        cat.products.forEach((p) => {
          const mrp = toNumber(p.mrp);
          const price = toNumber(p.sellingPrice);
          const savings = mrp > price ? mrp - price : 0;
          const discountPercent = mrp > 0 ? Math.round((savings / mrp) * 100) : 0;

          productRows.push({
            'S.No': sNo++,
            Category: cat.name,
            'Category (Tamil)': cat.nameTa || '',
            'Product Name': p.name,
            'Product Name (Tamil)': p.nameTa || '',
            SKU: p.sku || `RF-${p.id}`,
            'Actual MRP (₹)': mrp,
            'Wholesale Offer Price (₹)': price,
            'Savings (₹)': savings,
            'Discount (%)': `${discountPercent}%`,
          });
        });
      });

      const wsProducts = XLSX.utils.json_to_sheet(productRows);
      XLSX.utils.book_append_sheet(wb, wsProducts, 'Cracker Price List');

      // 2. Combos Worksheet
      if (combos.length > 0) {
        const comboRows: Array<Record<string, string | number>> = [];
        let comboNo = 1;

        combos.forEach((c) => {
          const mrp = toNumber(c.mrp);
          const price = toNumber(c.sellingPrice);
          const itemsIncluded = (c.comboItems || [])
            .map((ci) => `${ci.quantity}x ${ci.product.name}`)
            .join(', ');

          comboRows.push({
            'S.No': comboNo++,
            'Combo Package Name': c.name,
            'Package Name (Tamil)': c.nameTa || '',
            'Items Included': itemsIncluded || c.description || 'Assorted Crackers Collection',
            'Total MRP (₹)': mrp,
            'Combo Festival Price (₹)': price,
            'Savings (₹)': mrp > price ? mrp - price : 0,
          });
        });

        const wsCombos = XLSX.utils.json_to_sheet(comboRows);
        XLSX.utils.book_append_sheet(wb, wsCombos, 'Diwali Combo Packs');
      }

      // 3. Depot Info Sheet
      const infoRows = [
        { Parameter: 'Store Name', Details: APP_CONFIG.STORE_NAME },
        { Parameter: 'Location & Depot', Details: APP_CONFIG.STORE_ADDRESS },
        { Parameter: 'Contact Phone', Details: APP_CONFIG.STORE_PHONE },
        { Parameter: 'WhatsApp Hotline', Details: `+${APP_CONFIG.WHATSAPP_NUMBER}` },
        { Parameter: 'Official Email', Details: APP_CONFIG.STORE_EMAIL },
        { Parameter: 'Dispatch Terms', Details: 'Direct Factory Dispatch from Sivakasi with LR Transport Tracking' },
        { Parameter: 'Pricing Note', Details: 'All prices are inclusive of GST and heavy-duty factory moisture-proof packaging' },
        { Parameter: 'Statutory Disclaimer', Details: 'Online catalog for enquiry and estimation only. Commercial offline dispatch in accordance with Explosives Act.' },
      ];
      const wsInfo = XLSX.utils.json_to_sheet(infoRows);
      XLSX.utils.book_append_sheet(wb, wsInfo, 'Depot & Booking Info');

      // Generate and trigger download
      const currentYear = new Date().getFullYear();
      XLSX.writeFile(wb, `Rajalakshmi_Fireworks_Price_List_${currentYear}.xlsx`);
      toast.success(
        locale === 'ta'
          ? 'விலைப் பட்டியல் எக்செல் கோப்பாக பதிவிறக்கப்பட்டது!'
          : 'Price list Excel spreadsheet downloaded successfully!'
      );
    } catch (err) {
      console.error(err);
      toast.error(locale === 'ta' ? 'பதிவிறக்குவதில் பிழை ஏற்பட்டது' : 'Failed to export Excel file');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${APP_CONFIG.STORE_NAME} - Diwali Price List & Brochure`,
        text: `Download the latest Sivakasi fireworks price list and festival discounts from ${APP_CONFIG.STORE_NAME}!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(locale === 'ta' ? 'இணைப்பு நகலெடுக்கப்பட்டது!' : 'Price list link copied to clipboard!');
    }
  };

  const handleQuickAdd = (p: PriceListProduct) => {
    addItem({
      productId: p.id,
      name: p.name,
      slug: p.slug,
      mrp: toNumber(p.mrp),
      sellingPrice: toNumber(p.sellingPrice),
      image: p.media?.[0]?.url || null,
      maxStock: p.stockQuantity || 100,
    });
    toast.success(
      locale === 'ta'
        ? `${p.nameTa || p.name} உங்கள் பையில் சேர்க்கப்பட்டது!`
        : `Added ${p.name} to your enquiry bag!`
    );
  };

  return (
    <div className="w-full min-h-screen bg-[#f8f9fa] text-neutral-900 select-none font-sans print:bg-white print:text-black">
      {/* ── Screen-Only Hero & Action Bar ── */}
      <div className="print:hidden border-b border-neutral-200 bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold mb-2">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                <span>
                  {locale === 'ta'
                    ? 'அதிகாரப்பூர்வ சிவகாசி விலைப் பட்டியல் & பிரசுரம்'
                    : 'Official Sivakasi Wholesale Price List & Brochure'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-neutral-950 tracking-tight">
                {locale === 'ta' ? 'ராஜலக்ஷ்மி பட்டாசு தீபாவளி விலைப் பட்டியல்' : `${APP_CONFIG.STORE_NAME} Diwali Price Catalog`}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                {locale === 'ta'
                  ? 'நேரடி சிவகாசி பட்டாசுகள் • 80% வரை தள்ளுபடி • ஜிஎஸ்டி மற்றும் பேக்கிங் அடங்கும்'
                  : '100% Genuine Sivakasi Crackers • Factory Wholesale Prices • GST Included'}
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              {/* Print / Save PDF */}
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer shadow-md"
              >
                <Printer className="h-4 w-4" />
                <span>{locale === 'ta' ? 'PDF பதிவிறக்கம் / பிரிண்ட்' : 'Print / Save PDF'}</span>
              </button>

              {/* Download Excel Sheet */}
              <button
                type="button"
                onClick={handleExportExcel}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer shadow-md"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>{locale === 'ta' ? 'எக்செல் பட்டியல் (.xlsx)' : 'Download Excel'}</span>
              </button>

              {/* Share / WhatsApp */}
              <button
                type="button"
                onClick={handleShare}
                className="h-11 w-11 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-all active:scale-95 cursor-pointer"
                title="Share Price List"
                aria-label="Share Price List"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Search Bar & Category Filter Pills */}
          <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-100">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  locale === 'ta'
                    ? 'பட்டாசு அல்லது குறியீட்டைத் தேடுங்கள்...'
                    : 'Search cracker name or code...'
                }
                className="w-full h-10 pl-10 pr-4 rounded-full bg-neutral-100 border border-neutral-200 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-400"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-neutral-950 text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {locale === 'ta' ? 'அனைத்தும்' : 'All Products'} ({totalProductsCount})
              </button>

              {combos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('combos')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === 'combos'
                      ? 'bg-amber-500 text-black shadow-xs font-black'
                      : 'bg-amber-100/70 text-amber-950 hover:bg-amber-200'
                  }`}
                >
                  🎁 {locale === 'ta' ? 'காம்போக்கள்' : 'Diwali Combos'} ({combos.length})
                </button>
              )}

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat.slug
                      ? 'bg-neutral-950 text-white shadow-xs'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {getLocalizedName(cat, locale)} ({cat.products.length})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Printable Brochure Document Canvas ── */}
      <div
        ref={printableRef}
        id="price-list-printable"
        className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 print:p-0 print:max-w-full"
      >
        {/* ── 1. Document Header & Official Sivakasi Masthead ── */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-neutral-200/90 mb-8 print:border-b-2 print:border-black print:rounded-none print:shadow-none print:p-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 pb-6 border-b border-neutral-100 print:border-black">
            {/* Left: Brand Identity */}
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-2">
              <BrandLogo className="h-14 sm:h-16 w-auto max-h-16 object-contain" />
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight">
                  {locale === 'ta' ? 'ராஜலக்ஷ்மி பட்டாசு' : APP_CONFIG.STORE_NAME}
                </h2>
                <p className="text-xs text-neutral-600 font-medium">
                  {locale === 'ta'
                    ? 'அசல் சிவகாசி நேரடி பட்டாசு உற்பத்தியாளர் & மொத்த விநியோகம்'
                    : 'Premier Sivakasi Fireworks Manufacturer & Direct Wholesale Outlet'}
                </p>
              </div>
            </div>

            {/* Right: Contact & Verification Badges */}
            <div className="text-center sm:text-right space-y-1.5 text-xs text-neutral-600">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 print:border-black">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>100% Sivakasi Genuine • CSIR-NEERI Green Certified</span>
              </div>
              <p className="flex items-center justify-center sm:justify-end gap-1.5 font-medium">
                <MapPin className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                <span>{APP_CONFIG.STORE_ADDRESS}</span>
              </p>
              <p className="flex items-center justify-center sm:justify-end gap-1.5 font-bold text-neutral-900">
                <Phone className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                <span>{APP_CONFIG.STORE_PHONE}</span>
                <span className="text-neutral-300">|</span>
                <MessageSquare className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>+{APP_CONFIG.WHATSAPP_NUMBER}</span>
              </p>
              <p className="text-[11px] text-neutral-500">
                <span>{APP_CONFIG.STORE_EMAIL}</span>
              </p>
            </div>
          </div>

          {/* Key Highlights Strip inside Document */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 text-center text-xs">
            <div className="p-2.5 rounded-2xl bg-neutral-50 border border-neutral-100 print:border-black">
              <span className="block font-black text-sm text-neutral-950">₹500</span>
              <span className="text-[11px] text-neutral-500">{locale === 'ta' ? 'குறைந்தபட்ச ஆர்டர்' : 'Min Order Value'}</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-neutral-50 border border-neutral-100 print:border-black">
              <span className="block font-black text-sm text-emerald-600">Up to 80% OFF</span>
              <span className="text-[11px] text-neutral-500">{locale === 'ta' ? 'தொழிற்சாலை தள்ளுபடி' : 'Factory Discount'}</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-neutral-50 border border-neutral-100 print:border-black">
              <span className="block font-black text-sm text-neutral-950">100% GST Included</span>
              <span className="text-[11px] text-neutral-500">{locale === 'ta' ? 'வரி அடங்கும்' : 'Taxes Included'}</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-neutral-50 border border-neutral-100 print:border-black">
              <span className="block font-black text-sm text-neutral-950">LR Tracking</span>
              <span className="text-[11px] text-neutral-500">{locale === 'ta' ? 'பாதுகாப்பான லாரி பார்சல்' : 'Licensed Transport'}</span>
            </div>
          </div>
        </div>

        {/* ── 2. Curated Combos & Gift Packages Section ── */}
        {filteredCombos.length > 0 && (
          <div className="mb-10 page-break-inside-avoid">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black">
                  🎁
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-neutral-950 tracking-tight">
                    {locale === 'ta' ? 'தீபாவளி சிறப்பு காம்போ & பரிசுப் பெட்டிகள்' : 'Diwali Mega Value Combos & Gift Packages'}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {locale === 'ta'
                      ? 'முழுக் குடும்பத்திற்கும் ஏற்ற சிறந்த பட்டாசுகளின் சிறப்புத் தொகுப்பு'
                      : 'Handcrafted all-in-one celebration boxes with massive festive savings'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCombos.map((combo) => {
                const mrp = toNumber(combo.mrp);
                const price = toNumber(combo.sellingPrice);
                const savings = mrp > price ? mrp - price : 0;
                const discountPercent = mrp > 0 ? Math.round((savings / mrp) * 100) : 0;

                return (
                  <div
                    key={combo.id}
                    className="bg-white rounded-2xl p-5 border border-amber-200 shadow-xs flex flex-col justify-between relative overflow-hidden print:border-black print:rounded-none"
                  >
                    <div className="absolute top-0 right-0 bg-amber-500 text-black font-black text-[10px] px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                      {discountPercent}% OFF
                    </div>

                    <div>
                      <h4 className="font-black text-base text-neutral-950 pr-16 leading-snug">
                        {getLocalizedName(combo, locale)}
                      </h4>
                      <p className="text-xs text-neutral-600 mt-1 line-clamp-2">
                        {getLocalizedDescription(combo, locale) || (locale === 'ta' ? 'அனைத்து வகை பட்டாசுகளும் அடங்கிய சிறப்பு தொகுப்பு.' : 'Curated celebration combo with assorted fireworks.')}
                      </p>

                      {/* Included Items List */}
                      {combo.comboItems && combo.comboItems.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-neutral-100">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                            {locale === 'ta' ? 'இதில் உள்ள பட்டாசுகள்:' : 'Package Breakdown:'}
                          </p>
                          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                            {combo.comboItems.map((ci) => (
                              <span
                                key={ci.id}
                                className="inline-flex items-center px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800 text-[11px] font-medium"
                              >
                                {ci.quantity}x {getLocalizedName(ci.product, locale)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Price and Add CTA */}
                    <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between gap-4">
                      <div>
                        {mrp > price && (
                          <span className="text-xs text-neutral-400 line-through font-mono">
                            {formatCurrency(mrp)}
                          </span>
                        )}
                        <div className="text-lg font-black text-neutral-950 font-mono leading-none">
                          {formatCurrency(price)}
                        </div>
                      </div>

                      <div className="print:hidden">
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(combo as unknown as PriceListProduct)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold active:scale-95 transition-all cursor-pointer shadow-xs"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
                          <span>{locale === 'ta' ? 'சேர்க்க' : 'Add to Bag'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 3. Categorized Product Price Tables ── */}
        <div className="space-y-8">
          {filteredCategories.map((category) => {
            let catIndex = 1;

            return (
              <div
                key={category.id}
                className="bg-white rounded-3xl p-5 sm:p-7 border border-neutral-200/90 shadow-xs page-break-inside-avoid print:rounded-none print:border-black print:p-0 print:shadow-none mb-6"
              >
                {/* Category Header */}
                <div className="flex items-center justify-between gap-4 pb-4 mb-4 border-b border-neutral-100 print:border-black">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-neutral-950 tracking-tight">
                        {getLocalizedName(category, locale)}
                      </h3>
                      {category.description && (
                        <p className="text-xs text-neutral-500 hidden sm:block">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-xs font-bold text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full print:border print:border-black">
                    {category.products.length} {locale === 'ta' ? 'வகைகள்' : 'Items'}
                  </span>
                </div>

                {/* Products Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider text-[10px] print:text-black">
                        <th className="pb-2.5 w-12 text-center">#</th>
                        <th className="pb-2.5 pl-2">{locale === 'ta' ? 'பட்டாசு பெயர்' : 'Cracker Item Name'}</th>
                        <th className="pb-2.5 hidden sm:table-cell text-center w-24">{locale === 'ta' ? 'குறியீடு' : 'Code'}</th>
                        <th className="pb-2.5 text-right w-24">{locale === 'ta' ? 'அசல் விலை' : 'Original MRP'}</th>
                        <th className="pb-2.5 text-right w-28 text-neutral-950 font-black">{locale === 'ta' ? 'விற்பனை விலை' : 'Wholesale Price'}</th>
                        <th className="pb-2.5 text-right w-20 text-emerald-600 hidden sm:table-cell">{locale === 'ta' ? 'தள்ளுபடி' : 'Savings'}</th>
                        <th className="pb-2.5 w-20 text-center print:hidden">{locale === 'ta' ? 'செயல்' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 font-sans print:divide-neutral-300">
                      {category.products.map((product) => {
                        const mrp = toNumber(product.mrp);
                        const price = toNumber(product.sellingPrice);
                        const savings = mrp > price ? mrp - price : 0;
                        const discountPercent = mrp > 0 ? Math.round((savings / mrp) * 100) : 0;
                        const displayName = getLocalizedName(product, locale);
                        const sku = product.sku || `RF-${product.id.toString().padStart(3, '0')}`;

                        return (
                          <tr
                            key={product.id}
                            className="hover:bg-neutral-50/80 transition-colors group"
                          >
                            <td className="py-3 text-center text-neutral-400 font-mono text-[11px]">
                              {catIndex++}
                            </td>

                            <td className="py-3 pl-2">
                              <div className="flex items-center gap-2.5">
                                {product.media?.[0]?.url && (
                                  <div className="relative h-9 w-9 rounded-lg overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200 hidden sm:block print:hidden">
                                    <Image
                                      src={product.media[0].url}
                                      alt={displayName}
                                      fill
                                      className="object-cover"
                                      sizes="36px"
                                    />
                                  </div>
                                )}
                                <div>
                                  <span className="font-bold text-neutral-950 text-xs sm:text-sm block">
                                    {displayName}
                                  </span>
                                  {product.nameTa && locale !== 'ta' && (
                                    <span className="text-[11px] text-neutral-400 block font-normal">
                                      {product.nameTa}
                                    </span>
                                  )}
                                  {product.name && locale === 'ta' && (
                                    <span className="text-[11px] text-neutral-400 block font-normal">
                                      {product.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="py-3 hidden sm:table-cell text-center font-mono text-[11px] text-neutral-500">
                              {sku}
                            </td>

                            <td className="py-3 text-right text-neutral-400 font-mono line-through text-xs">
                              {mrp > price ? formatCurrency(mrp) : '-'}
                            </td>

                            <td className="py-3 text-right font-mono font-black text-neutral-950 text-xs sm:text-sm">
                              {formatCurrency(price)}
                            </td>

                            <td className="py-3 text-right font-mono font-bold text-emerald-600 hidden sm:table-cell text-xs">
                              {discountPercent > 0 ? `${discountPercent}% OFF` : '-'}
                            </td>

                            <td className="py-3 text-center print:hidden">
                              <button
                                type="button"
                                onClick={() => handleQuickAdd(product)}
                                className="h-7 w-7 rounded-full bg-neutral-100 hover:bg-neutral-950 hover:text-white text-neutral-800 inline-flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                                title={`Add ${displayName} to Bag`}
                                aria-label={`Add ${displayName} to Bag`}
                              >
                                <ShoppingBag className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 4. Terms, Dispatch Policy & Statutory Compliance Footer ── */}
        <div className="mt-10 bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-xs print:border-t-2 print:border-black print:rounded-none print:p-4 page-break-inside-avoid">
          <h4 className="font-black text-sm uppercase tracking-wider text-neutral-900 mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {locale === 'ta' ? 'முக்கிய விதிமுறைகள் & பார்சல் வழிகாட்டுதல்' : 'Terms, Logistics & Ordering Information'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-neutral-600 leading-relaxed">
            <div className="space-y-2">
              <p>
                <strong>1. {locale === 'ta' ? 'விலை விபரம்:' : 'Pricing & Packaging:'}</strong>{' '}
                {locale === 'ta'
                  ? 'விலைப் பட்டியலில் குறிப்பிட்டுள்ள அனைத்து விலைகளிலும் ஜிஎஸ்டி மற்றும் தொழிற்சாலை ஈரப்பதம் புகா பேக்கிங் அடங்கும்.'
                  : 'All rates are inclusive of GST, factory moisture-proof packaging, and direct Sivakasi dispatch.'}
              </p>
              <p>
                <strong>2. {locale === 'ta' ? 'போக்குவரத்து வசதி:' : 'Transport Logistics:'}</strong>{' '}
                {locale === 'ta'
                  ? 'அங்கீகரிக்கப்பட்ட லாரி பார்சல் சர்வீஸ் மூலம் உங்கள் ஊருக்கு அருகிலுள்ள டிரான்ஸ்போர்ட் அலுவலகத்திற்கு அனுப்பி வைக்கப்படும்.'
                  : 'Dispatched through licensed transport carriers to your nearest town depot. LR number provided on dispatch.'}
              </p>
            </div>

            <div className="space-y-2">
              <p>
                <strong>3. {locale === 'ta' ? 'ஆர்டர் உறுதிப்படுத்தல்:' : 'Order Confirmation:'}</strong>{' '}
                {locale === 'ta'
                  ? 'விசாரணை படிவம் சமர்ப்பித்தவுடன் எங்கள் வாடிக்கையாளர் சேவைக்குழுவினர் வாட்ஸ்அப் அல்லது தொலைபேசி வழியாக உறுதிப்படுத்துவர்.'
                  : 'Our dispatch desk contacts you directly via WhatsApp/Phone after enquiry submission for offline verification.'}
              </p>
              <p>
                <strong>4. {locale === 'ta' ? 'சட்டப்பூர்வ அறிவிப்பு:' : 'Statutory Notice:'}</strong>{' '}
                {locale === 'ta'
                  ? 'நீதிமன்ற வழிகாட்டுதலின்படி இது தகவல் மற்றும் விலை மதிப்பீட்டிற்கு மட்டுமே. விற்பனை சட்டவிதிகளுக்கு உட்பட்டது.'
                  : 'As per Supreme Court directives, this is an estimate/catalog. Commercial fulfillment strictly complies with the Explosives Act.'}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-neutral-500">
            <span>© {new Date().getFullYear()} {APP_CONFIG.STORE_NAME}. Sivakasi, Tamil Nadu.</span>
            <span className="font-bold text-neutral-800">Hotline: {APP_CONFIG.STORE_PHONE} | WhatsApp: +{APP_CONFIG.WHATSAPP_NUMBER}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
