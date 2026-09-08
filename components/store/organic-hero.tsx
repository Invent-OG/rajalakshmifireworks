'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Pause, Play, ArrowRight } from 'lucide-react';
import { HeroSettingsConfig, DEFAULT_HERO_CONFIG } from '@/lib/hero-config';

interface OrganicHeroCarouselProps {
  initialConfig?: HeroSettingsConfig;
}

export function OrganicHero({ initialConfig = DEFAULT_HERO_CONFIG }: OrganicHeroCarouselProps) {
  const config = initialConfig || DEFAULT_HERO_CONFIG;
  const slides = config.slides?.length > 0 ? config.slides : DEFAULT_HERO_CONFIG.slides;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentIdx((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIdx((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = (idx: number) => {
    setCurrentIdx(idx);
  };

  // Autoplay timer
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    const intervalTime = config.autoplayIntervalMs || 6000;
    const timer = setInterval(() => {
      nextSlide();
    }, intervalTime);

    return () => clearInterval(timer);
  }, [slides.length, isPaused, config.autoplayIntervalMs, nextSlide]);

  // Touch Swipe Handlers for mobile
  const minSwipeDistance = 50;
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  const currentSlide = slides[currentIdx] || slides[0];

  return (
    <section
      className="w-full pt-4 sm:pt-6 pb-6 sm:pb-10"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="w-full max-w-[100%] px-3 sm:px-6 lg:px-10 xl:px-12">

        {/* ── Main Hero Frame with Background Image & Color ── */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            backgroundColor: currentSlide.bgColor || '#a6d7e7',
          }}
          className="relative rounded-[36px] sm:rounded-[40px] text-neutral-900 overflow-hidden shadow-sm p-6 sm:p-10 lg:p-14 min-h-[460px] lg:min-h-[500px] flex flex-col justify-between transition-colors duration-700 ease-in-out"
        >
          {/* Background Image Layer if configured */}
          {currentSlide.backgroundImage && (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 pointer-events-none"
              style={{
                backgroundImage: `url(${currentSlide.backgroundImage})`,
                opacity: currentSlide.bgImageOpacity ?? 0.85,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent" />
            </div>
          )}

          {/* Main Slide Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center flex-1 relative z-10">

            {/* Left Column: Typography & Action */}
            <div className="lg:col-span-8 flex flex-col justify-center text-left space-y-5 sm:space-y-6 z-20">
              <h1 className="hero-heading text-4xl sm:text-6xl lg:text-[4.5rem] font-black tracking-tight uppercase leading-[0.92] text-neutral-950 select-none animate-in fade-in slide-in-from-left-4 duration-500">
                <span>{currentSlide.headlineLine1}</span>
                <br />
                <span>{currentSlide.headlineLine2}</span>
                <br />
                <span>{currentSlide.headlineLine3}</span>
              </h1>

              <p className="hero-text text-neutral-800 text-sm sm:text-base lg:text-[1.1rem] font-medium leading-relaxed max-w-lg">
                {currentSlide.subtitle}
              </p>

              <div className="hero-ctas pt-2">
                <Link
                  href={currentSlide.ctaLink || '/products'}
                  id="hero-see-products-btn"
                  className="inline-flex items-center justify-center px-9 py-4 rounded-full bg-neutral-950 text-white text-xs sm:text-sm font-bold tracking-widest uppercase hover:bg-neutral-800 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg gap-2"
                >
                  <span>{currentSlide.ctaText || 'SEE PRODUCTS'}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Right Column: Stacked Showcase Cards Linked to Products */}
            <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-5 justify-center z-20">

              {/* Card 1: Top Product Card */}
              {currentSlide.card1 && (
                <Link
                  href={currentSlide.card1.link || '/products'}
                  style={{ backgroundColor: currentSlide.card1.bgColor || '#b5144f' }}
                  className="group relative flex items-center gap-4 text-white p-4 sm:p-5 rounded-[24px] sm:rounded-[28px] shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.03] active:scale-98 overflow-hidden"
                >
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-[18px] overflow-hidden shrink-0 bg-black/20 shadow-inner">
                    <img
                      src={currentSlide.card1.image || '/images/hero/card-dried-fruits.jpg'}
                      alt={currentSlide.card1.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-sm sm:text-base leading-snug tracking-tight truncate">
                      {currentSlide.card1.title}
                    </span>
                    <span className="text-xs text-white/80 font-medium underline underline-offset-2 decoration-white/40 group-hover:decoration-white transition-colors mt-1 flex items-center gap-1">
                      <span>{currentSlide.card1.subtitle || 'Explore'}</span>
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              )}

              {/* Card 2: Bottom Product Card */}
              {currentSlide.card2 && (
                <Link
                  href={currentSlide.card2.link || '/products'}
                  style={{ backgroundColor: currentSlide.card2.bgColor || '#114b82' }}
                  className="group relative flex items-center gap-4 text-white p-4 sm:p-5 rounded-[24px] sm:rounded-[28px] shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.03] active:scale-98 overflow-hidden"
                >
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-[18px] overflow-hidden shrink-0 bg-black/20 shadow-inner">
                    <img
                      src={currentSlide.card2.image || '/images/hero/card-advent-calendar.jpg'}
                      alt={currentSlide.card2.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-sm sm:text-base leading-snug tracking-tight truncate">
                      {currentSlide.card2.title}
                    </span>
                    <span className="text-xs text-white/80 font-medium underline underline-offset-2 decoration-white/40 group-hover:decoration-white transition-colors mt-1 flex items-center gap-1">
                      <span>{currentSlide.card2.subtitle || 'Explore'}</span>
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              )}

            </div>

          </div>

          {/* ── Carousel Navigation Controls & Indicators ── */}
          {slides.length > 1 && (
            <div className="relative z-30 pt-6 flex items-center justify-between border-t border-black/10 mt-6">

              {/* Left / Right Arrow Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevSlide}
                  aria-label="Previous Slide"
                  className="h-9 w-9 rounded-full bg-black/15 hover:bg-black/25 text-neutral-900 flex items-center justify-center backdrop-blur-xs transition-all active:scale-95"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  aria-label="Next Slide"
                  className="h-9 w-9 rounded-full bg-black/15 hover:bg-black/25 text-neutral-900 flex items-center justify-center backdrop-blur-xs transition-all active:scale-95"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Dot Indicators */}
              <div className="flex items-center gap-2">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => goToSlide(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`h-2.5 rounded-full transition-all duration-300 ${currentIdx === idx
                      ? 'w-8 bg-neutral-950'
                      : 'w-2.5 bg-neutral-950/25 hover:bg-neutral-950/40'
                      }`}
                  />
                ))}
              </div>

              {/* Pause / Play status toggle */}
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                aria-label={isPaused ? 'Resume autoplay' : 'Pause autoplay'}
                className="text-xs font-semibold text-neutral-800/80 hover:text-neutral-950 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/10 hover:bg-black/15 transition-colors"
              >
                {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                <span className="hidden sm:inline">{isPaused ? 'Paused' : 'Auto'}</span>
              </button>

            </div>
          )}

        </div>

        {/* ── USP Trust Ribbon Strip ── */}
        <div className="mt-4 sm:mt-6 bg-white rounded-[28px] sm:rounded-[36px] py-4 sm:py-5 px-4 sm:px-8 shadow-sm overflow-x-auto scrollbar-none">
          <div className="flex items-center justify-between min-w-[720px] lg:min-w-0 gap-6 sm:gap-8 text-xs sm:text-[13px] font-semibold text-neutral-800">
            <div className="flex items-center gap-2.5 whitespace-nowrap select-none hover:text-brand transition-colors">
              <span className="text-lg sm:text-xl">🚚</span>
              <span>Short supply chain</span>
            </div>
            <div className="flex items-center gap-2.5 whitespace-nowrap select-none hover:text-brand transition-colors">
              <span className="text-lg sm:text-xl">⚖️</span>
              <span>Fair prices</span>
            </div>
            <div className="flex items-center gap-2.5 whitespace-nowrap select-none hover:text-brand transition-colors">
              <span className="text-lg sm:text-xl">🥜</span>
              <span>High quality</span>
            </div>
            <div className="flex items-center gap-2.5 whitespace-nowrap select-none hover:text-brand transition-colors">
              <span className="text-lg sm:text-xl">🌿</span>
              <span>Transparency</span>
            </div>
            <div className="flex items-center gap-2.5 whitespace-nowrap select-none hover:text-brand transition-colors">
              <span className="text-lg sm:text-xl">📦</span>
              <span>Bulk packaging</span>
            </div>
            <div className="flex items-center gap-2.5 whitespace-nowrap select-none hover:text-brand transition-colors">
              <span className="text-lg sm:text-xl">🤟</span>
              <span>Community</span>
            </div>
            <div className="flex items-center gap-2.5 whitespace-nowrap select-none hover:text-brand transition-colors">
              <span className="text-lg sm:text-xl">🚀</span>
              <span>Fast delivery</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
