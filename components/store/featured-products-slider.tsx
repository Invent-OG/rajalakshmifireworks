'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles, Package } from 'lucide-react';
import { ProductCard } from '@/components/store/product-card';
import { SectionTag } from '@/components/ui/section-tag';
import { useLocale, useTranslations } from '@/lib/i18n/context';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger, isReducedMotion } from '@/lib/motion';

interface ProductItem {
  id: number;
  name: string;
  nameTa?: string | null;
  slug: string;
  description?: string | null;
  descriptionTa?: string | null;
  sku?: string | null;
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
  scrollDrift?: 'left' | 'right';
}

export function FeaturedProductsSlider({
  products = [],
  title,
  subtitle,
  tagLabel,
  viewAllHref = '/products?featured=true',
  viewAllLabel,
  scrollDrift,
}: FeaturedProductsSliderProps) {
  const locale = useLocale();
  const tProducts = useTranslations('products');
  const tCommon = useTranslations('common');

  const finalTitle = title || (locale === 'ta' ? 'சிறப்பு பட்டாசு ரகங்கள்' : 'Featured Fireworks');
  const finalSubtitle =
    subtitle ||
    (locale === 'ta'
      ? 'கம்பி மத்தாப்புகள், வான்வெளி வெடிகள் மற்றும் வண்ணமயமான பவுண்டன்களின் தேர்ந்தெடுக்கப்பட்ட சிறப்பு தொகுப்பு.'
      : 'Hand-selected aerial cakes, vibrant flower pots, and family combo boxes tested for maximum sparkle.');
  const finalTagLabel = tagLabel || (locale === 'ta' ? 'சிறப்பு தொகுப்பு' : 'Curated Collections');
  const finalViewAllLabel = viewAllLabel || (locale === 'ta' ? 'அனைத்தையும் பார்க்க' : 'View All');

  const sectionRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const trackInnerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Drag to scroll state
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  // ── GSAP Scroll Entrance & Smooth Parallax Drift ──
  useGSAP(
    () => {
      if (isReducedMotion() || !sectionRef.current) return;

      const mm = gsap.matchMedia();

      // Desktop animation: Staggered reveal & subtle scroll drift
      mm.add('(min-width: 768px)', () => {
        const header = sectionRef.current?.querySelector('.slider-header');
        const cards = sectionRef.current?.querySelectorAll('.slider-card-item');

        if (header) {
          gsap.fromTo(
            header,
            { opacity: 0, y: 30 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              ease: 'power3.out',
              clearProps: 'transform,opacity',
              scrollTrigger: {
                trigger: sectionRef.current,
                start: 'top 85%',
                toggleActions: 'play none none none',
              },
            }
          );
        }

        if (cards && cards.length > 0) {
          gsap.fromTo(
            cards,
            { opacity: 0, y: 35, scale: 0.96 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.65,
              stagger: 0.05,
              ease: 'power3.out',
              clearProps: 'transform,opacity',
              scrollTrigger: {
                trigger: scrollContainerRef.current,
                start: 'top 88%',
                toggleActions: 'play none none none',
              },
            }
          );
        }

        // Smooth subtle parallax slide drift while scrolling past the section
        if (trackInnerRef.current) {
          const driftAmount = scrollDrift === 'right' ? 35 : -35;
          gsap.fromTo(
            trackInnerRef.current,
            { x: -driftAmount },
            {
              x: driftAmount,
              ease: 'none',
              scrollTrigger: {
                trigger: sectionRef.current,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.2,
              },
            }
          );
        }
      });

      // Mobile animation: Lightweight single container reveal
      mm.add('(max-width: 767px)', () => {
        gsap.fromTo(
          sectionRef.current,
          { opacity: 0, y: 15 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: 'power2.out',
            clearProps: 'all',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 90%',
              toggleActions: 'play none none none',
            },
          }
        );
      });

      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [products.length, scrollDrift] }
  );

  const checkScrollability = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    setCanScrollLeft(scrollLeft > 15);
    setCanScrollRight(scrollLeft < maxScroll - 15);
    if (maxScroll > 0) {
      setScrollProgress(Math.min(1, Math.max(0, scrollLeft / maxScroll)));
    }
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

  // Silky-Smooth Card Sliding for Arrow Buttons
  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;

    // Dynamically calculate one card step + gap
    const firstCard = el.querySelector<HTMLElement>('.slider-card-item');
    const cardStep = firstCard ? firstCard.offsetWidth + 24 : 340;
    const scrollAmount = direction === 'left' ? -cardStep * 1.5 : cardStep * 1.5;
    const targetScroll = Math.max(0, Math.min(el.scrollLeft + scrollAmount, el.scrollWidth - el.clientWidth));

    if (isReducedMotion()) {
      el.scrollTo({ left: targetScroll, behavior: 'smooth' });
    } else {
      gsap.to(el, {
        scrollLeft: targetScroll,
        duration: 0.65,
        ease: 'power3.out',
        onUpdate: checkScrollability,
        onComplete: checkScrollability,
      });
    }
  };

  // Mouse Drag to Scroll handlers (Desktop Mouse)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    setIsDragging(true);
    setStartX(e.pageX - el.offsetLeft);
    setScrollLeftState(el.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 1.35;
    el.scrollLeft = scrollLeftState - walk;
  };

  if (products.length === 0) return null;

  return (
    <section ref={sectionRef} className="reveal-section w-full overflow-hidden">
      {/* ── Section Header with Rounded Outline Pill Button (Constrained container) ── */}
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-8 md:px-[80px]">
        <div className="slider-header flex flex-col md:flex-row justify-between items-start md:items-end mb-6 sm:mb-8 md:mb-10 gap-4 md:gap-6">
          <div className="max-w-[640px]">
            <div className="mb-3 sm:mb-4">
              <SectionTag label={finalTagLabel} />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-[44px] lg:text-[50px] font-bold text-neutral-950 leading-[1.15] md:leading-[1.1] tracking-tight">
              {finalTitle} <span className="text-neutral-400 font-light">—</span>
            </h2>
            <p className="text-[13px] sm:text-[15px] text-neutral-600 font-normal leading-relaxed mt-2 max-w-xl">
              {finalSubtitle}
            </p>
          </div>

          {/* Header Action: Pill Button & Navigation Arrows */}
          <div className="flex items-center gap-3 self-start md:self-end shrink-0">
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-white hover:bg-neutral-950 text-neutral-900 hover:text-white border-2 border-neutral-900 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-xs active:scale-95 group"
            >
              <span>{finalViewAllLabel}</span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            {/* Slider Arrow Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                aria-label="Scroll left"
                className="h-11 w-11 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-900 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer shadow-2xs active:scale-95 shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                aria-label="Scroll right"
                className="h-11 w-11 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer shadow-md active:scale-95 shrink-0"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Full-Width Horizontal Scrollable Track ── */}
      <div ref={trackInnerRef} className="w-full">
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className={`flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar snap-x snap-proximity sm:snap-mandatory py-4 -my-4 px-4 sm:px-8 md:px-12 xl:px-[max(2rem,calc((100vw-1280px)/2+80px))] overscroll-x-contain select-none touch-pan-x ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Product Cards */}
          {products.map((product) => (
            <div
              key={product.id}
              className="slider-card-item snap-start shrink-0 w-[270px] sm:w-[310px] md:w-[340px] flex flex-col transition-transform duration-300 hover:scale-[1.02]"
            >
              <ProductCard product={product} />
            </div>
          ))}

        {/* ── End Card: "Show More" / "View All" Redirect Card ── */}
        <div className="slider-card-item snap-start shrink-0 w-[240px] sm:w-[280px] md:w-[300px] flex flex-col">
          <Link
            href={viewAllHref}
            className="group h-full min-h-[380px] sm:min-h-[420px] rounded-[32px] p-6 sm:p-8 bg-neutral-900 hover:bg-neutral-950 text-white flex flex-col justify-between items-start transition-all duration-300 shadow-md hover:shadow-xl hover:scale-[1.02] border-2 border-neutral-800"
          >
            {/* Top Icon Badge */}
            <div className="space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-white/10 group-hover:bg-white/20 text-white flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <Sparkles className="h-7 w-7 text-amber-400" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 block">
                {locale === 'ta' ? 'முழு பட்டியல்' : 'Full Catalog'}
              </span>
            </div>

            {/* Middle Message */}
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-snug text-white">
                {locale === 'ta'
                  ? 'மேலும் பட்டாசுகளை காண்க'
                  : `Explore More ${finalTitle}`}
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {locale === 'ta'
                  ? 'எங்கள் முழு பட்டாசு பட்டியலை பார்வையிட்டு மொத்த விலையில் தேர்வு செய்யவும்.'
                  : 'Browse our complete Sivakasi collection with transparent wholesale factory pricing.'}
              </p>
            </div>

            {/* Bottom Button */}
            <div className="w-full pt-4 border-t border-white/10">
              <span className="w-full h-11 px-4 rounded-full bg-white text-neutral-950 group-hover:bg-neutral-100 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs">
                <span>{locale === 'ta' ? 'அனைத்தையும் பார்க்க' : 'View All'}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* ── Subdued Minimalist Capsule Scroll Progress Track ── */}
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-8 md:px-[80px] mt-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-24 sm:w-36 h-1 rounded-full bg-neutral-200/80 overflow-hidden">
            <div
              className="h-full bg-neutral-950 rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${Math.max(15, Math.min(100, scrollProgress * 100))}%`,
              }}
            />
          </div>
          <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
            {products.length}+ Items
          </span>
        </div>
        <span className="text-[11px] font-medium text-neutral-400 hidden sm:inline-block">
          {locale === 'ta' ? 'நகர்த்த இடது / வலதுபுறம் உருட்டவும்' : 'Swipe or drag to explore'}
        </span>
      </div>
    </div>
  </section>
  );
}
