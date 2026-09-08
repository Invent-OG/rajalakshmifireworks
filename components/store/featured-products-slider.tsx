'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '@/components/store/product-card';
import { SectionTag } from '@/components/ui/section-tag';

interface ProductItem {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  mrp: string;
  sellingPrice: string;
  stockQuantity: number;
  category?: { name: string; slug: string } | null;
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
  title = 'Featured Fireworks',
  subtitle = 'Hand-selected aerial cakes, vibrant flower pots, and family combo boxes tested for maximum sparkle and tested safety.',
  tagLabel = 'Curated Collections',
  viewAllHref = '/products?featured=true',
  viewAllLabel = 'View All Featured',
}: FeaturedProductsSliderProps) {
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
    <section className="reveal-section w-full max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12">
      {/* ── Section Header with Arrows ── */}
      <div className="section-header flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 pb-4  border-neutral-100 gap-4">
        <div className="space-y-3">
          <SectionTag label={tagLabel} />
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-neutral-950">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 font-normal max-w-xl">
            {subtitle}
          </p>
        </div>

        {/* Header Action & Slider Navigation Controls */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all justify-center"
          >
            <span>{viewAllLabel}</span>
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
        className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-2 -my-2 px-1 -mx-1"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="snap-start shrink-0 w-[280px] sm:w-[320px] lg:w-[340px] flex flex-col"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
