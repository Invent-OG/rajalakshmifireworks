'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '@/components/store/product-card';
import { SectionTag } from '@/components/ui/section-tag';
import { useLocale, useTranslations } from '@/lib/i18n/context';

interface ProductItem {
  id: number;
  name: string;
  nameTa?: string | null;
  slug: string;
  description?: string | null;
  descriptionTa?: string | null;
  mrp: string;
  sellingPrice: string;
  stockQuantity: number;
  category?: { name: string; nameTa?: string | null; slug: string } | null;
  media?: Array<{ url: string; alt?: string | null }>;
}

interface FeaturedProductsSliderProps {
  products: ProductItem[];
  title?: string;
  subtitle?: string;
  tagLabel?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}

export function FeaturedProductsSlider({
  products = [],
  title,
  subtitle,
  tagLabel,
  viewAllHref = '/products?featured=true',
  viewAllLabel,
}: FeaturedProductsSliderProps) {
  const locale = useLocale();
  const tProducts = useTranslations('products');
  const tCommon = useTranslations('common');

  const finalTitle = title || (locale === 'ta' ? 'சிறப்பு பட்டாசு ரகங்கள்' : 'Featured Fireworks');
  const finalSubtitle = subtitle || (locale === 'ta'
    ? 'கம்பி மத்தாப்புகள், வான்வெளி வெடிகள் மற்றும் வண்ணமயமான பவுண்டன்களின் தேர்ந்தெடுக்கப்பட்ட சிறப்பு தொகுப்பு.'
    : 'Hand-selected aerial cakes, vibrant flower pots, and family combo boxes tested for maximum sparkle and tested safety.');
  const finalTagLabel = tagLabel || (locale === 'ta' ? 'சிறப்பு தொகுப்பு' : 'Curated Collections');
  const finalViewAllLabel = viewAllLabel || (locale === 'ta' ? 'அனைத்தையும் பார்க்க' : 'View All');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollability = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    checkScrollability();
    el.addEventListener('scroll', checkScrollability, { passive: true });
    window.addEventListener('resize', checkScrollability);

    return () => {
      el.removeEventListener('scroll', checkScrollability);
      window.removeEventListener('resize', checkScrollability);
    };
  }, [checkScrollability, products.length]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const cardWidth = 340;
    const scrollAmount = direction === 'left' ? -cardWidth * 1.5 : cardWidth * 1.5;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  if (products.length === 0) return null;

  return (
    <section className="reveal-section w-full max-w-[1280px] mx-auto px-4 sm:px-8 md:px-[80px]">
      {/* ── Section Header with Arrows ── */}
      <div className="section-header flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-[48px] gap-4 md:gap-6">
        <div className="max-w-[640px]">
          <div className="mb-5 sm:mb-8">
            <SectionTag label={finalTagLabel} />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-[58px] font-medium text-[#111010] leading-[1.15] md:leading-[1.1] tracking-tight">
            {finalTitle}
          </h2>
          <p className="text-[14px] sm:text-[15px] text-[#555455] font-normal leading-relaxed mt-3 max-w-xl">
            {finalSubtitle}
          </p>
        </div>

        {/* Header Action & Slider Navigation Controls */}
        <div className="flex items-center gap-3 self-start md:self-end shrink-0 pb-1">
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all justify-center"
          >
            <span>{finalViewAllLabel}</span>
            <ChevronRight className="h-4 w-4" />
          </Link>

          {/* Left / Right Slider Arrows */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
              className="h-12 w-12 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-900 disabled:opacity-35 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-95 shrink-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="Scroll right"
              className="h-12 w-12 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white disabled:opacity-35 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer shadow-md active:scale-95 shrink-0"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Horizontal Scrollable Track ── */}
      <div
        ref={scrollContainerRef}
        className="flex gap-[20px] md:gap-[32px] overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-2 -my-2 px-1 -mx-1"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="snap-start shrink-0 w-[280px] sm:w-[320px] md:w-[350px] flex flex-col"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
