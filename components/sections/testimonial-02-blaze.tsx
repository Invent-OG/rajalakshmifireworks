'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Clock, ArrowUpRight, Star, Sparkle, Sparkles, MapPin } from 'lucide-react';
import { SectionTag } from '@/components/ui/section-tag';

const REVIEWS = [
  {
    name: 'Karthik & Ananya R.',
    tour: 'Chennai, Diwali 2025',
    quote: "The 120-shot sky shots and sparklers were pure magic! Direct delivery from Sivakasi in sturdy packaging with zero damages.",
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
  },
  {
    name: 'Suresh Kumar',
    tour: 'Bangalore, Festive Gift Box',
    quote: "Best wholesale pricing and guaranteed green crackers. Kids loved the flower pots and spinning ground chakras. Will order every year!",
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
  },
  {
    name: 'Meera Venkatesh',
    tour: 'Hyderabad, Family Mega Pack',
    quote: "100% genuine Sivakasi quality. Everything arrived safely well before Diwali, perfectly packed and clearly labelled.",
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
  },
];

// Doubled review array for a seamless translateY(-50%) vertical loop
const MARQUEE_ITEMS = [...REVIEWS, ...REVIEWS];

export function Testimonial02Blaze() {
  return (
    <>
      {/* Scoped Google Font DM Sans */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

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

      <section
        className="w-full bg-white py-12 md:py-[120px] px-4 sm:px-8 md:px-[80px] selection:bg-black selection:text-white"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="max-w-[1280px] mx-auto">
          {/* 1. Top Header Row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-[48px] gap-4 md:gap-6">
            {/* Left Block */}
            <div className="max-w-[600px]">
              {/* Section Tag Row */}
              <div className="mb-5 sm:mb-8">
                <SectionTag label="Testimonials" />
              </div>

              {/* Heading */}
              <h2 className="text-3xl sm:text-4xl md:text-[58px] font-medium text-[#111010] leading-[1.15] md:leading-[1.1] tracking-tight">
                What families say
                <br />
                <span className="text-black">about our fireworks</span>
              </h2>
            </div>

            {/* Right Block */}
            <div className="w-full md:w-auto md:max-w-[280px] text-left md:text-right pb-2">
              <p className="text-[14px] sm:text-[15px] text-[#555455] font-normal leading-relaxed">
                Every celebration is built on trust, safety, and unforgettable fireworks – shared by those who lived it.
              </p>
            </div>
          </div>

          {/* 2. Three-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[32px] items-stretch">
            {/* Left Column — Stats / CTA Card */}
            <div className="flex flex-col bg-white p-8 sm:p-10 rounded-[36px] sm:rounded-[40px] min-h-[480px] lg:h-[560px] shadow-sm hover:shadow-xl transition-all duration-300">
              {/* Rating Row */}
              <div className="flex items-start gap-[12px] mb-[28px]">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-[48px] font-bold text-[#111010] leading-none tracking-tight">
                    4.9
                  </span>
                  <span className="text-[16px] text-[#898988] font-normal">/5</span>
                </div>
                <div className="pt-1.5 text-[13px] text-[#555455] leading-[1.3] font-medium">
                  Based on <strong className="font-bold text-[#111010]">2,500+ verified</strong>
                  <br />
                  celebration reviews
                </div>
              </div>

              {/* Feature List */}
              <div className="space-y-[16px] mb-[32px]">
                <div className="flex items-center gap-[12px]">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                    <MapPin size={16} className="text-amber-500 shrink-0" />
                  </div>
                  <span className="text-[14px] text-[#454544] font-medium tracking-tight">
                    10,000+ orders safely dispatched
                  </span>
                </div>
                <div className="flex items-center gap-[12px]">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                    <Shield size={16} className="text-emerald-500 shrink-0" />
                  </div>
                  <span className="text-[14px] text-[#454544] font-medium tracking-tight">
                    100% safe &amp; certified Sivakasi green crackers
                  </span>
                </div>
                <div className="flex items-center gap-[12px]">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                    <Clock size={16} className="text-sky-500 shrink-0" />
                  </div>
                  <span className="text-[14px] text-[#454544] font-medium tracking-tight">
                    15+ years of Diwali celebration trust
                  </span>
                </div>
              </div>

              {/* CTA Block */}
              <div className="mt-auto pt-6 border-t border-neutral-100">
                <p className="text-[14px] text-[#676666] mb-0.5 font-normal">
                  Ready to plan your celebration?
                </p>
                <p className="text-[16px] font-bold text-[#111010] mb-[18px] tracking-tight">
                  Let&apos;s get started!
                </p>

                {/* Button Group */}
                <div className="flex items-center gap-[8px] group">
                  <Link
                    href="/products"
                    className="px-8 py-[14px] bg-[#111010] text-white text-[15px] font-bold rounded-full hover:bg-black transition-all cursor-pointer whitespace-nowrap duration-300 active:scale-95 shadow-sm"
                  >
                    Plan your fireworks
                  </Link>
                  <Link
                    href="/products"
                    aria-label="Submit trip plan"
                    className="w-[48px] h-[48px] bg-[#111010] rounded-full flex items-center justify-center text-white hover:bg-black transition-all cursor-pointer shadow-sm duration-300 group-hover:-translate-x-2 active:scale-95"
                  >
                    <ArrowUpRight size={18} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Center Column — Photo Card with Quote Overlay */}
            <div className="flex min-h-[480px] lg:h-[560px]">
              <div className="relative w-full h-full rounded-[36px] sm:rounded-[40px] overflow-hidden group shadow-sm hover:shadow-xl transition-all duration-300 flex">
                <img
                  src="https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&q=80&w=1200"
                  alt="Diwali family celebration with fireworks"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
                <div className="absolute bottom-[32px] left-[32px] right-[32px] text-white">
                  <p className="text-[18px] md:text-[20px] font-medium leading-[1.4] mb-[12px]">
                    “We expected bright lights and joy — we found pure magic, safety, and a celebration our family will cherish forever.”
                  </p>
                  <p className="text-[14px] text-white/75 font-normal tracking-wide">
                    — Rajesh &amp; Priya, Chennai, Diwali Celebration
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column — Vertical Marquee */}
            <div className="md:col-span-2 lg:col-span-1 min-h-[480px] lg:h-[560px] relative overflow-hidden rounded-[36px] sm:rounded-[40px] bg-neutral-100/60 shadow-inner">
              <div
                className="flex flex-col gap-4 p-3"
                style={{ animation: 'marquee-up 30s linear infinite' }}
              >
                {MARQUEE_ITEMS.map((item, idx) => (
                  <div
                    key={`${item.name}-${idx}`}
                    className="bg-white p-6 rounded-[28px] shadow-sm hover:shadow-md transition-all flex flex-col shrink-0"
                  >
                    {/* 5 Stars */}
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, starIdx) => (
                        <Star
                          key={starIdx}
                          size={13}
                          className="text-amber-400 fill-amber-400"
                        />
                      ))}
                    </div>

                    {/* Quote */}
                    <p className="text-[14px] text-[#454544] font-medium leading-[1.6] mb-4">
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
                        <p className="text-[13px] font-bold text-[#111010]">
                          — {item.name}
                        </p>
                        <p className="text-[12px] text-[#898988] font-medium">
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
