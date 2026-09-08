'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Clock, ArrowUpRight, Star, Sparkle, Sparkles, MapPin } from 'lucide-react';

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
        className="w-full bg-white dark:bg-neutral-950 py-[80px] md:py-[120px] px-4 sm:px-8 md:px-[80px] selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="max-w-[1280px] mx-auto">
          {/* 1. Top Header Row */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-[48px] gap-6">
            {/* Left Block */}
            <div className="max-w-[600px]">
              {/* Section Tag Row */}
              <div className="flex items-center gap-1.5 mb-8">
                {/* Circular Rotating Sparkle Badge */}
                <div className="w-[44px] h-[44px] rounded-full border border-[#e2e8f1] dark:border-neutral-800 flex items-center justify-center bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                    className="flex items-center justify-center"
                  >
                    <Sparkle size={18} className="text-[#0f162b] fill-[#0f162b] dark:text-amber-400 dark:fill-amber-400" />
                  </motion.div>
                </div>

                {/* Pill Tag */}
                <div className="px-[12px] py-[12px] rounded-full border border-[#e2e8f1] dark:border-neutral-800 flex items-center justify-center bg-white dark:bg-neutral-900 shadow-xs">
                  <span className="text-[16px] font-medium text-[#0f162b] dark:text-neutral-100 px-3 whitespace-nowrap tracking-tight">
                    Testimonials
                  </span>
                </div>
              </div>

              {/* Heading */}
              <h2 className="text-[44px] md:text-[58px] font-medium text-[#111010] dark:text-white leading-[1.1] tracking-tight">
                What families say
                <br />
                <span className="text-black dark:text-neutral-200">about our fireworks</span>
              </h2>
            </div>

            {/* Right Block */}
            <div className="max-w-[280px] md:text-right pb-2">
              <p className="text-[15px] text-[#555455] dark:text-neutral-400 font-normal leading-relaxed">
                Every celebration is built on trust, safety, and unforgettable fireworks – shared by those who lived it.
              </p>
            </div>
          </div>

          {/* 2. Three-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[32px] items-stretch">
            {/* Left Column — Stats / CTA Card */}
            <div className="flex flex-col bg-[#f8f8f8] dark:bg-neutral-900 p-8 rounded-[32px] border border-[#f1f0f0] dark:border-neutral-800 min-h-[480px] lg:h-[560px] shadow-xs">
              {/* Rating Row */}
              <div className="flex items-start gap-[12px] mb-[28px]">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-[48px] font-bold text-[#111010] dark:text-white leading-none tracking-tight">
                    4.9
                  </span>
                  <span className="text-[16px] text-[#898988] dark:text-neutral-500 font-normal">/5</span>
                </div>
                <div className="pt-1.5 text-[13px] text-[#555455] dark:text-neutral-400 leading-[1.3] font-medium">
                  Based on <strong className="font-bold text-[#111010] dark:text-white">2,500+ verified</strong>
                  <br />
                  celebration reviews
                </div>
              </div>

              {/* Feature List */}
              <div className="space-y-[14px] mb-[32px]">
                <div className="flex items-center gap-[10px]">
                  <MapPin size={16} className="text-[#555455] dark:text-amber-400 shrink-0" />
                  <span className="text-[14px] text-[#454544] dark:text-neutral-300 font-medium tracking-tight">
                    10,000+ orders safely dispatched
                  </span>
                </div>
                <div className="flex items-center gap-[10px]">
                  <Shield size={16} className="text-[#555455] dark:text-emerald-400 shrink-0" />
                  <span className="text-[14px] text-[#454544] dark:text-neutral-300 font-medium tracking-tight">
                    100% safe &amp; certified Sivakasi green crackers
                  </span>
                </div>
                <div className="flex items-center gap-[10px]">
                  <Clock size={16} className="text-[#555455] dark:text-sky-400 shrink-0" />
                  <span className="text-[14px] text-[#454544] dark:text-neutral-300 font-medium tracking-tight">
                    15+ years of Diwali celebration trust
                  </span>
                </div>
              </div>

              {/* CTA Block */}
              <div className="mt-auto pt-6 border-t border-[#eeefee] dark:border-neutral-800">
                <p className="text-[14px] text-[#676666] dark:text-neutral-400 mb-0.5 font-normal">
                  Ready to plan your celebration?
                </p>
                <p className="text-[16px] font-bold text-[#111010] dark:text-white mb-[18px] tracking-tight">
                  Let&apos;s get started!
                </p>

                {/* Button Group */}
                <div className="flex items-center gap-[8px] group">
                  <Link
                    href="/products"
                    className="px-8 py-[14px] bg-[#111010] dark:bg-white text-white dark:text-neutral-950 text-[15px] font-bold rounded-full hover:bg-black dark:hover:bg-neutral-200 transition-all cursor-pointer whitespace-nowrap duration-300 active:scale-95 shadow-sm"
                  >
                    Plan your fireworks
                  </Link>
                  <Link
                    href="/products"
                    aria-label="Submit trip plan"
                    className="w-[48px] h-[48px] bg-[#111010] dark:bg-white rounded-full flex items-center justify-center text-white dark:text-neutral-950 hover:bg-black dark:hover:bg-neutral-200 transition-all cursor-pointer shadow-sm duration-300 group-hover:-translate-x-2 active:scale-95"
                  >
                    <ArrowUpRight size={18} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Center Column — Photo Card with Quote Overlay */}
            <div className="flex min-h-[480px] lg:h-[560px]">
              <div className="relative w-full h-full rounded-[32px] overflow-hidden group shadow-sm flex">
                <img
                  src="https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&q=80&w=1200"
                  alt="Diwali family celebration with fireworks"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
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
            <div className="md:col-span-2 lg:col-span-1 min-h-[480px] lg:h-[560px] relative overflow-hidden rounded-[32px] border border-[#f1f0f0] dark:border-neutral-800 bg-[#f8f8f8]/30 dark:bg-neutral-900/30">
              <div
                className="flex flex-col gap-4 p-2"
                style={{ animation: 'marquee-up 30s linear infinite' }}
              >
                {MARQUEE_ITEMS.map((item, idx) => (
                  <div
                    key={`${item.name}-${idx}`}
                    className="bg-white dark:bg-neutral-900 p-6 rounded-[24px] border border-[#f1f0f0] dark:border-neutral-800 shadow-sm flex flex-col shrink-0"
                  >
                    {/* 5 Stars */}
                    <div className="flex gap-0.5 mb-3">
                      {[...Array(5)].map((_, starIdx) => (
                        <Star
                          key={starIdx}
                          size={12}
                          className="text-amber-400 fill-amber-400"
                        />
                      ))}
                    </div>

                    {/* Quote */}
                    <p className="text-[14px] text-[#454544] dark:text-neutral-300 font-medium leading-[1.6] mb-4">
                      “{item.quote}”
                    </p>

                    {/* Footer with Avatar & Attribution */}
                    <div className="mt-auto flex items-center gap-3">
                      <img
                        src={item.avatar}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover shadow-sm border border-neutral-200 dark:border-neutral-700"
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
