'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useLocale } from '@/lib/i18n/context';

interface DiwaliCountdownBannerProps {
  targetDate?: string; // ISO string e.g. "2026-11-08T00:00:00+05:30"
}

export function DiwaliCountdownBanner({
  targetDate = '2026-11-08T00:00:00+05:30',
}: DiwaliCountdownBannerProps) {
  const locale = useLocale();

  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isFinished: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isFinished: false,
  });

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const target = new Date(targetDate).getTime();

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isFinished: true,
        });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        isFinished: false,
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const padZero = (n: number) => String(n).padStart(2, '0');

  return (
    <section className="w-full max-w-[1280px] mx-auto px-3 sm:px-6 md:px-8 select-none">
      <div className="relative rounded-[28px] sm:rounded-[36px] md:rounded-[44px] overflow-hidden shadow-2xl border border-amber-500/30 bg-neutral-950 text-white min-h-[440px] sm:min-h-[480px] md:min-h-[520px] flex flex-col justify-end">
        {/* ── Background Poster Image ── */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/banners/diwali-countdown-bg.jpg"
          alt="Diwali Countdown Celebration"
          className="absolute inset-0 w-full h-full object-cover object-center md:object-[center_35%] pointer-events-none"
        />

        {/* ── Subtle Atmospheric Ambient Gradient for Text Legibility ── */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-black/20 to-black/60 pointer-events-none" />

        {/* ── Interactive Live Timer & Action Overlay ── */}
        <div className="relative z-10 p-5 sm:p-8 md:p-12 flex flex-col lg:flex-row items-center lg:items-end justify-between gap-6 md:gap-8">
          {/* Left / Info Text */}
          <div className="text-center lg:text-left space-y-2 max-w-xl">


            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white drop-shadow-md leading-[1.1]">
              {locale === 'ta' ? (
                <>
                  தீபாவளி <span className="text-amber-400">கவுண்ட்டவுன்</span>
                </>
              ) : (
                <>
                  Diwali <span className="text-amber-400">Countdown</span>
                </>
              )}
            </h2>

            <p className="text-xs sm:text-sm text-neutral-200/90 font-medium leading-relaxed drop-shadow-sm max-w-md">
              {locale === 'ta'
                ? 'ஒளிரும் தீபங்கள், வண்ணமயமான சிவகாசி நேரடி பட்டாசுகளுடன் உங்கள் குடும்பத்துடன் மகிழ்ச்சியாகக் கொண்டாடுங்கள்.'
                : 'May the festival of lights fill every heart with hope. Pre-book authentic Sivakasi fireworks with factory direct pricing.'}
            </p>
          </div>

          {/* Right / Live Ticking Timer Counters & CTA */}
          <div className="flex flex-col items-center lg:items-end gap-4 sm:gap-5 w-full lg:w-auto">
            {/* 4 Ornate Glowing Countdown Boxes */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4 w-full max-w-md sm:max-w-lg">
              {/* Days Box */}
              <div className="relative flex flex-col items-center justify-center p-2.5 sm:p-4 rounded-[18px] sm:rounded-[24px] bg-black/60 backdrop-blur-md border border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black font-mono tracking-tight text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.4)]">
                  {isMounted ? padZero(timeLeft.days) : '10'}
                </span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-400 mt-1">
                  {locale === 'ta' ? 'நாட்கள்' : 'Days'}
                </span>
              </div>

              {/* Hours Box */}
              <div className="relative flex flex-col items-center justify-center p-2.5 sm:p-4 rounded-[18px] sm:rounded-[24px] bg-black/60 backdrop-blur-md border border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black font-mono tracking-tight text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.4)]">
                  {isMounted ? padZero(timeLeft.hours) : '08'}
                </span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-400 mt-1">
                  {locale === 'ta' ? 'மணிகள்' : 'Hours'}
                </span>
              </div>

              {/* Minutes Box */}
              <div className="relative flex flex-col items-center justify-center p-2.5 sm:p-4 rounded-[18px] sm:rounded-[24px] bg-black/60 backdrop-blur-md border border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black font-mono tracking-tight text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.4)]">
                  {isMounted ? padZero(timeLeft.minutes) : '24'}
                </span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-400 mt-1">
                  {locale === 'ta' ? 'நிமிடங்கள்' : 'Minutes'}
                </span>
              </div>

              {/* Seconds Box */}
              <div className="relative flex flex-col items-center justify-center p-2.5 sm:p-4 rounded-[18px] sm:rounded-[24px] bg-black/60 backdrop-blur-md border border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black font-mono tracking-tight text-amber-400 drop-shadow-[0_2px_12px_rgba(245,158,11,0.6)]">
                  {isMounted ? padZero(timeLeft.seconds) : '56'}
                </span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-300 mt-1">
                  {locale === 'ta' ? 'நொடிகள்' : 'Seconds'}
                </span>
              </div>
            </div>

            {/* Action Button Link */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                href="/products"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 sm:h-13 px-7 sm:px-9 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 shadow-[0_6px_25px_rgba(245,158,11,0.4)] active:scale-95 group"
              >
                <span>{locale === 'ta' ? 'பட்டாசுகளைப் பார்வையிடவும்' : 'Shop Festive Fireworks'}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
