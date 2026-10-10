'use client';

import React from 'react';
import Link from '@/components/ui/link';
import { Shield, Clock, ArrowUpRight, Star, MapPin } from 'lucide-react';
import { SectionTag } from '@/components/ui/section-tag';
import { useTranslations, useLocale } from '@/lib/i18n/context';

export function Testimonial02Blaze() {
  const t = useTranslations('testimonials');
  const tNav = useTranslations('navigation');
  const locale = useLocale();

  const REVIEWS = [
    {
      name: t('review1Name'),
      tour: t('review1City'),
      quote: t('review1Text'),
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    },
    {
      name: t('review2Name'),
      tour: t('review2City'),
      quote: t('review2Text'),
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    },
    {
      name: t('review3Name'),
      tour: t('review3City'),
      quote: t('review3Text'),
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    },
  ];

  const MARQUEE_ITEMS = [...REVIEWS, ...REVIEWS, ...REVIEWS, ...REVIEWS];

  return (
    <>
      {/* Scoped Keyframe Animation */}
      <style>{`
        @keyframes marquee-up {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-50%);
          }
        }
      `}</style>

      <section className="w-full bg-transparent py-6 sm:py-10 md:py-[100px] px-4 sm:px-8 md:px-[80px] selection:bg-black selection:text-white font-sans">
        <div className="max-w-[1280px] mx-auto">
          {/* 1. Top Header Row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 sm:mb-8 md:mb-[48px] gap-4 md:gap-6">
            {/* Left Block */}
            <div className="max-w-[600px]">
              {/* Section Tag Row */}
              <div className="mb-4 sm:mb-6 md:mb-8">
                <SectionTag label={t('badge')} />
              </div>

              {/* Heading */}
              <h2 className="text-2xl sm:text-4xl md:text-[58px] font-medium text-[#111010] dark:text-white leading-[1.15] md:leading-[1.1] tracking-tight font-heading">
                {t('title')}
              </h2>
            </div>

            {/* Right Block */}
            <div className="w-full md:w-auto md:max-w-[320px] text-left md:text-right pb-1 md:pb-2">
              <p className="text-[13px] sm:text-[15px] text-[#555455] dark:text-neutral-400 font-normal leading-relaxed">
                {t('subtitle')}
              </p>
            </div>
          </div>

          {/* 2. Three-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-[32px] items-stretch">
            {/* Left Column — Stats / CTA Card */}
            <div className="flex flex-col bg-white dark:bg-[#141414] dark:border dark:border-[#282828] p-6 sm:p-8 lg:p-10 rounded-[28px] sm:rounded-[36px] lg:rounded-[40px] min-h-0 lg:h-[560px] shadow-sm dark:shadow-none hover:shadow-xl transition-all duration-300">
              {/* Rating Row */}
              <div className="flex items-start gap-[12px] mb-5 sm:mb-[28px]">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-[40px] sm:text-[48px] font-bold text-[#111010] dark:text-white leading-none tracking-tight font-mono">
                    4.9
                  </span>
                  <span className="text-[15px] sm:text-[16px] text-[#898988] dark:text-neutral-400 font-normal font-mono">/5</span>
                </div>
                <div className="pt-1 text-[12px] sm:text-[13px] text-[#555455] dark:text-neutral-300 leading-[1.3] font-medium">
                  {locale === 'ta' ? (
                    <>
                      <strong className="font-bold text-[#111010] dark:text-white">2,500+ சரிபார்க்கப்பட்ட</strong>
                      <br />
                      வாடிக்கையாளர் மதிப்புரைகள்
                    </>
                  ) : (
                    <>
                      Based on <strong className="font-bold text-[#111010] dark:text-white">2,500+ verified</strong>
                      <br />
                      celebration reviews
                    </>
                  )}
                </div>
              </div>

              {/* Feature List */}
              <div className="space-y-[16px] mb-[32px]">
                <div className="flex items-center gap-[12px]">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-[#202020] flex items-center justify-center shrink-0">
                    <MapPin size={16} className="text-amber-500 shrink-0" />
                  </div>
                  <span className="text-[14px] text-[#454544] dark:text-neutral-300 font-medium tracking-tight">
                    {locale === 'ta' ? '10,000+ பாதுகாப்பான டெலிவரிகள்' : '10,000+ orders safely dispatched'}
                  </span>
                </div>
                <div className="flex items-center gap-[12px]">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-[#202020] flex items-center justify-center shrink-0">
                    <Shield size={16} className="text-emerald-500 shrink-0" />
                  </div>
                  <span className="text-[14px] text-[#454544] dark:text-neutral-300 font-medium tracking-tight">
                    {locale === 'ta' ? '100% பாதுகாப்பான சிவகாசி பசுமை பட்டாசுகள்' : '100% safe & certified Sivakasi green crackers'}
                  </span>
                </div>
                <div className="flex items-center gap-[12px]">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-[#202020] flex items-center justify-center shrink-0">
                    <Clock size={16} className="text-sky-500 shrink-0" />
                  </div>
                  <span className="text-[14px] text-[#454544] dark:text-neutral-300 font-medium tracking-tight">
                    {locale === 'ta' ? '30+ ஆண்டுகால சிவகாசி பாரம்பரிய நம்பிக்கை' : '30+ years of Diwali celebration trust'}
                  </span>
                </div>
              </div>

              {/* CTA Block */}
              <div className="mt-auto pt-6 border-t border-neutral-100 dark:border-[#282828]">
                <p className="text-[14px] text-[#676666] dark:text-neutral-400 mb-0.5 font-normal">
                  {locale === 'ta' ? 'உங்கள் பண்டிகையைக் கொண்டாடத் தயாரா?' : 'Ready to plan your celebration?'}
                </p>
                <p className="text-[16px] font-bold text-[#111010] dark:text-white mb-[18px] tracking-tight">
                  {locale === 'ta' ? 'இப்போதே தேர்வு செய்யுங்கள்!' : "Let's get started!"}
                </p>

                {/* Button Group */}
                <div className="flex items-center gap-2 group">
                  <Link
                    href={locale === 'en' ? '/products' : `/${locale}/products`}
                    className="h-12 px-6 sm:px-8 bg-neutral-950 dark:bg-white text-white dark:text-black text-xs sm:text-sm font-bold rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all cursor-pointer whitespace-nowrap duration-300 active:scale-95 shadow-sm inline-flex items-center justify-center"
                  >
                    {tNav('allProducts')}
                  </Link>
                  <Link
                    href={locale === 'en' ? '/products' : `/${locale}/products`}
                    aria-label="View fireworks catalog"
                    className="h-12 w-12 bg-neutral-950 dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all cursor-pointer shadow-sm duration-300 group-hover:translate-x-1 active:scale-95 shrink-0"
                  >
                    <ArrowUpRight size={18} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Center Column — Photo Card with Quote Overlay */}
            <div className="flex h-[320px] sm:h-[420px] lg:h-[560px]">
              <div className="relative w-full h-full rounded-[28px] sm:rounded-[36px] lg:rounded-[40px] overflow-hidden group shadow-sm hover:shadow-xl transition-all duration-300 flex">
                <img
                  src="https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&q=80&w=1200"
                  alt="Diwali family celebration with fireworks"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
                <div className="absolute bottom-[24px] sm:bottom-[32px] left-[20px] sm:left-[32px] right-[20px] sm:right-[32px] text-white">
                  <p className="text-[16px] sm:text-[18px] md:text-[20px] font-medium leading-[1.4] mb-[8px] sm:mb-[12px]">
                    {locale === 'ta'
                      ? '“ஒளிமயமான மகிழ்ச்சி, முழு பாதுகாப்பு மற்றும் எங்கள் குடும்பம் என்றும் நினைவில் வைத்துப் போற்றும் தீபாவளிக் கொண்டாட்டம்!”'
                      : '“We expected bright lights and joy — we found pure magic, safety, and a celebration our family will cherish forever.”'}
                  </p>
                  <p className="text-[13px] sm:text-[14px] text-white/75 font-normal tracking-wide">
                    {locale === 'ta' ? '— ராஜேஷ் & பிரியா, சென்னை' : '— Rajesh & Priya, Chennai'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column — Vertical Marquee */}
            <div className="md:col-span-2 lg:col-span-1 h-[380px] sm:h-[460px] lg:h-[560px] relative overflow-hidden rounded-[28px] sm:rounded-[36px] lg:rounded-[40px] bg-neutral-100/60 dark:bg-[#101010] dark:border dark:border-[#282828] shadow-inner [mask-image:linear-gradient(to_bottom,transparent,black_4%,black_96%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_4%,black_96%,transparent)]">
              <div
                className="flex flex-col gap-3.5 sm:gap-4 p-2.5 sm:p-3 hover:[animation-play-state:paused] active:[animation-play-state:paused]"
                style={{ animation: 'marquee-up 38s linear infinite' }}
              >
                {MARQUEE_ITEMS.map((item, idx) => (
                  <div
                    key={`${item.name}-${idx}`}
                    className="bg-white dark:bg-[#1a1a1a] dark:border dark:border-[#282828] p-5 sm:p-6 rounded-[24px] sm:rounded-[28px] shadow-sm dark:shadow-none hover:shadow-md transition-all flex flex-col shrink-0"
                  >
                    {/* 5 Stars */}
                    <div className="flex gap-1 mb-2.5 sm:mb-3">
                      {[...Array(5)].map((_, starIdx) => (
                        <Star
                          key={starIdx}
                          size={13}
                          className="text-amber-400 fill-amber-400"
                        />
                      ))}
                    </div>

                    {/* Quote */}
                    <p className="text-[14px] text-[#454544] dark:text-neutral-200 font-medium leading-[1.6] mb-4">
                      “{item.quote}”
                    </p>

                    {/* Footer with Avatar & Attribution */}
                    <div className="mt-auto flex items-center gap-3">
                      <img
                        src={item.avatar}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover shadow-sm"
                      />
                      <div>
                        <p className="text-[13px] font-bold text-[#111010] dark:text-white">
                          — {item.name}
                        </p>
                        <p className="text-[12px] text-[#898988] dark:text-neutral-400 font-medium">
                          {item.tour}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
