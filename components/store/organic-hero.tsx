'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Pause, Play, ArrowRight } from 'lucide-react';
import { HeroSettingsConfig, DEFAULT_HERO_CONFIG } from '@/lib/hero-config';
import { useLocale, useTranslations } from '@/lib/i18n/context';

interface OrganicHeroCarouselProps {
  initialConfig?: HeroSettingsConfig;
}

export function OrganicHero({ initialConfig = DEFAULT_HERO_CONFIG }: OrganicHeroCarouselProps) {
  const locale = useLocale();
  const tHero = useTranslations('hero');
  const tCommon = useTranslations('common');
  const config = initialConfig || DEFAULT_HERO_CONFIG;
  const slides = config.slides?.length > 0 ? config.slides : DEFAULT_HERO_CONFIG.slides;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const autoPlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // High-performance touch gesture tracking via ref to avoid render stutter
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentIdx((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIdx((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = (idx: number) => {
    setCurrentIdx(idx);
    handleUserAction();
  };

  // Temporarily pause autoplay when user manually interacts, then auto-resume after 8s
  const handleUserAction = () => {
    setIsUserInteracting(true);
    if (autoPlayTimeoutRef.current) clearTimeout(autoPlayTimeoutRef.current);
    autoPlayTimeoutRef.current = setTimeout(() => {
      setIsUserInteracting(false);
    }, 8000);
  };

  // Autoplay timer
  useEffect(() => {
    if (slides.length <= 1 || isUserInteracting) return;
    const intervalTime = config.autoplayIntervalMs || 5000;
    const timer = setInterval(() => {
      nextSlide();
    }, intervalTime);

    return () => clearInterval(timer);
  }, [slides.length, isUserInteracting, config.autoplayIntervalMs, nextSlide]);

  // Touch Swipe Handlers for mobile & touchscreens
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    if (!touch) return;

    const diffX = touchStartRef.current.x - touch.clientX;
    const diffY = touchStartRef.current.y - touch.clientY;

    // Trigger slide change only if horizontal swipe dominates vertical scroll
    if (Math.abs(diffX) > 30 && Math.abs(diffX) > Math.abs(diffY)) {
      handleUserAction();
      if (diffX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }

    touchStartRef.current = null;
  };

  const currentSlide = slides[currentIdx] || slides[0];

  // Dynamic localized text per active slide
  const headline1 = locale === 'ta' ? (currentSlide.headlineLine1Ta || currentSlide.headlineLine1) : currentSlide.headlineLine1;
  const headline2 = locale === 'ta' ? (currentSlide.headlineLine2Ta || currentSlide.headlineLine2) : currentSlide.headlineLine2;
  const headline3 = locale === 'ta' ? (currentSlide.headlineLine3Ta || currentSlide.headlineLine3) : currentSlide.headlineLine3;
  const subtitle = locale === 'ta' ? (currentSlide.subtitleTa || currentSlide.subtitle) : currentSlide.subtitle;
  const ctaText = locale === 'ta' ? (currentSlide.ctaTextTa || currentSlide.ctaText || 'பட்டாசுகளைப் பார்க்க') : (currentSlide.ctaText || 'SEE PRODUCTS');

  return (
    <section
      className="w-full pt-4 sm:pt-6 pb-6 sm:pb-10"
    >
      <div className="w-full max-w-[100%] px-3 sm:px-6 lg:px-10 xl:px-12">

        {/* ── Main Hero Frame with Background Image & Color ── */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            backgroundColor: currentSlide.bgColor || '#a6d7e7',
          }}
          className="relative rounded-[36px] sm:rounded-[40px] text-neutral-900 overflow-hidden shadow-sm p-6 sm:p-10 lg:p-14 min-h-[460px] lg:min-h-[500px] flex flex-col justify-between transition-colors duration-700 ease-in-out touch-pan-y select-none"
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
            <div key={`hero-left-${currentIdx}`} className="lg:col-span-8 flex flex-col justify-center text-left space-y-5 sm:space-y-6 z-20 transition-all duration-500">
              <h1 className="hero-heading text-4xl sm:text-6xl lg:text-[4.5rem] font-black tracking-tight uppercase leading-[0.92] text-neutral-950 select-none">
                <span>{headline1}</span>
                <br />
                <span>{headline2}</span>
                <br />
                <span>{headline3}</span>
              </h1>

              <p className="hero-text text-neutral-800 text-sm sm:text-base lg:text-[1.1rem] font-medium leading-relaxed max-w-lg">
                {subtitle}
              </p>

              <div className="hero-ctas pt-2">
                <Link
                  href={currentSlide.ctaLink || '/products'}
                  id="hero-see-products-btn"
                  className="inline-flex items-center justify-center h-12 sm:h-14 px-8 sm:px-9 rounded-full bg-neutral-950 text-white text-xs sm:text-sm font-bold tracking-widest uppercase hover:bg-neutral-800 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg gap-2"
                >
                  <span>{ctaText}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Right Column: Stacked Showcase Cards Linked to Products */}
            <div key={`hero-right-${currentIdx}`} className="lg:col-span-4 flex flex-col gap-4 sm:gap-5 justify-center z-20 transition-all duration-500">

              {/* Card 1: Top Product Card */}
              {currentSlide.card1 && (
                <Link
                  href={currentSlide.card1.link || '/products'}
                  style={{ backgroundColor: currentSlide.card1.bgColor || '#b5144f' }}
                  className="organic-hero-cards group relative flex items-center gap-4 text-white p-4 sm:p-5 rounded-[24px] sm:rounded-[28px] shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.03] active:scale-98 overflow-hidden"
                >
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-[18px] overflow-hidden shrink-0 bg-black/20 shadow-inner">
                    <img
                      src={currentSlide.card1.image || '/images/hero/card-dried-fruits.jpg'}
                      alt={currentSlide.card1.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 pointer-events-none"
                    />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-sm sm:text-base leading-snug tracking-tight truncate">
                      {locale === 'ta' ? (currentSlide.card1.titleTa || currentSlide.card1.title) : currentSlide.card1.title}
                    </span>
                    <span className="text-xs text-white/80 font-medium underline underline-offset-2 decoration-white/40 group-hover:decoration-white transition-colors mt-1 flex items-center gap-1">
                      <span>{locale === 'ta' ? (currentSlide.card1.subtitleTa || tCommon('explore')) : currentSlide.card1.subtitle}</span>
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
                  className="organic-hero-cards group relative flex items-center gap-4 text-white p-4 sm:p-5 rounded-[24px] sm:rounded-[28px] shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.03] active:scale-98 overflow-hidden"
                >
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-[18px] overflow-hidden shrink-0 bg-black/20 shadow-inner">
                    <img
                      src={currentSlide.card2.image || '/images/hero/card-advent-calendar.jpg'}
                      alt={currentSlide.card2.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 pointer-events-none"
                    />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-sm sm:text-base leading-snug tracking-tight truncate">
                      {locale === 'ta' ? (currentSlide.card2.titleTa || currentSlide.card2.title) : currentSlide.card2.title}
                    </span>
                    <span className="text-xs text-white/80 font-medium underline underline-offset-2 decoration-white/40 group-hover:decoration-white transition-colors mt-1 flex items-center gap-1">
                      <span>{locale === 'ta' ? (currentSlide.card2.subtitleTa || tCommon('explore')) : currentSlide.card2.subtitle}</span>
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
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUserAction();
                    prevSlide();
                  }}
                  aria-label="Previous Slide"
                  className="h-10 w-10 sm:h-9 sm:w-9 rounded-full bg-black/15 hover:bg-black/25 text-neutral-900 flex items-center justify-center backdrop-blur-xs transition-all active:scale-95 cursor-pointer touch-manipulation shadow-2xs"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUserAction();
                    nextSlide();
                  }}
                  aria-label="Next Slide"
                  className="h-10 w-10 sm:h-9 sm:w-9 rounded-full bg-black/15 hover:bg-black/25 text-neutral-900 flex items-center justify-center backdrop-blur-xs transition-all active:scale-95 cursor-pointer touch-manipulation shadow-2xs"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Dot Indicators */}
              <div className="flex items-center gap-2 py-2">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToSlide(idx);
                    }}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer touch-manipulation ${currentIdx === idx
                      ? 'w-8 bg-neutral-950'
                      : 'w-2.5 bg-neutral-950/25 hover:bg-neutral-950/40'
                      }`}
                  />
                ))}
              </div>

              {/* Pause / Play status toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsUserInteracting((prev) => !prev);
                }}
                aria-label={isUserInteracting ? 'Resume autoplay' : 'Pause autoplay'}
                className="text-xs font-semibold text-neutral-800/80 hover:text-neutral-950 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/10 hover:bg-black/15 transition-colors cursor-pointer touch-manipulation"
              >
                {isUserInteracting ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                <span className="hidden sm:inline">{isUserInteracting ? (locale === 'ta' ? 'நிறுத்தப்பட்டது' : 'Paused') : (locale === 'ta' ? 'சுழற்சி' : 'Auto')}</span>
              </button>

            </div>
          )}

        </div>

        {/* ── USP Trust Ribbon Strip ── */}
        <div
          className="bg-[#e24100] pt-[3rem] pb-[1rem] -mt-8 rounded-b-[36px] sm:rounded-b-[40px]  px-4 sm:px-8 shadow-sm overflow-x-auto no-scrollbar touch-pan-y"
        >
          <div className="flex items-center justify-between min-w-[720px] lg:min-w-0 gap-6 sm:gap-8 text-xs sm:text-[13px] font-semibold text-neutral-950">
            <div className="flex items-center gap-2.5 whitespace-nowrap select-none hover:text-white transition-colors">
              <span className="text-lg sm:text-xl">🏭</span>
              <span>{locale === 'ta' ? '100% நேரடி சிவகாசி' : '100% Direct from Sivakasi'}</span>
            </div>
            <div className="flex items-center gap-2.5 whitespace-nowrap select-none hover:text-white transition-colors">
              <span className="text-lg sm:text-xl">🏷️</span>
              <span>{locale === 'ta' ? 'மலிவான மொத்த விலை' : 'Wholesale Factory Prices'}</span>
            </div>
            <div className="flex items-center gap-2.5 whitespace-nowrap select-none hover:text-white transition-colors">
              <span className="text-lg sm:text-xl">🌿</span>
              <span>{locale === 'ta' ? 'அங்கீகரிக்கப்பட்ட பசுமை பட்டாசு' : 'Certified Green Fireworks'}</span>
            </div>
            <div className="flex items-center gap-2.5 whitespace-nowrap select-none hover:text-white transition-colors">
              <span className="text-lg sm:text-xl">📦</span>
              <span>{locale === 'ta' ? 'ஈரப்பதம் புகா பேக்கிங்' : 'Moisture-proof Packaging'}</span>
            </div>
            <div className="flex items-center gap-2.5 whitespace-nowrap select-none hover:text-white transition-colors">
              <span className="text-lg sm:text-xl">🚚</span>
              <span>{locale === 'ta' ? 'பாதுகாப்பான லாரி பார்சல்' : 'Safe Transport Dispatch'}</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
