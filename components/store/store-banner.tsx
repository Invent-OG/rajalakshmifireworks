'use client';

import { useQuery } from '@tanstack/react-query';
import { Banner } from '@/components/ui/banner';
import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from '@/lib/i18n/context';

interface StoreSettingsResponse {
  settings?: Record<string, string>;
}

export function StoreBanner() {
  const locale = useLocale();
  const tCommon = useTranslations('common');
  const { data } = useQuery<StoreSettingsResponse>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      if (!res.ok) return { settings: {} };
      return res.json();
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const settings = data?.settings || {};
  const isEnabled = settings.ANNOUNCEMENT_BANNER_ENABLED !== 'false';
  const defaultText = locale === 'ta'
    ? 'நேரடி சிவகாசி பட்டாசுகள் • 100% அசல் தரமான பசுமை பட்டாசுகள் • மலிவான மொத்த விலை'
    : 'Direct from Sivakasi • 100% Genuine Factory Sealed Fireworks • Wholesale Pricing';
  const text = settings.ANNOUNCEMENT_BANNER_TEXT || defaultText;
  const link = settings.ANNOUNCEMENT_BANNER_LINK || '/products';
  const variant = (settings.ANNOUNCEMENT_BANNER_VARIANT as 'rainbow' | 'normal') || 'rainbow';

  if (!isEnabled || !text.trim()) {
    return null;
  }

  // Festive celebration fireworks colors for the moving rainbow gradient
  const festiveColors = [
    'rgba(245, 158, 11, 0.85)',   // Amber Spark
    'rgba(255, 185, 0, 0.85)',   // Golden Sparkler
    'rgba(234, 179, 8, 0.85)',   // Warm Gold
    'rgba(56, 189, 248, 0.8)',   // Sky Blue
    'rgba(52, 211, 153, 0.8)',   // Emerald Spark
  ];

  return (
    <Banner
      id={`store-announcement-${text.length}`}
      variant={variant}
      rainbowColors={festiveColors}
      height="2.5rem"
      changeLayout={false}
      className="bg-neutral-950 text-white border-b border-white/10 shadow-xs z-50 text-xs sm:text-sm font-medium tracking-tight"
    >
      <div className="flex items-center justify-center gap-2 w-full px-4 sm:px-8 truncate">
        <Sparkles className="h-3.5 w-3.5 text-amber-300 shrink-0 animate-pulse" />
        <span className="truncate">{text}</span>
        {link && (
          <Link
            href={link}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 hover:text-amber-200 underline underline-offset-2 ml-1 shrink-0 transition-colors"
          >
            <span>{tCommon('explore')}</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </Banner>
  );
}
