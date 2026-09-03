'use client';

import { useQuery } from '@tanstack/react-query';
import { Banner } from '@/components/ui/banner';
import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface StoreSettingsResponse {
  settings?: Record<string, string>;
}

export function StoreBanner() {
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
  const text =
    settings.ANNOUNCEMENT_BANNER_TEXT ||
    'Direct from Sivakasi • 100% Genuine Factory Sealed Fireworks • Wholesale Pricing';
  const link = settings.ANNOUNCEMENT_BANNER_LINK || '/products';
  const variant = (settings.ANNOUNCEMENT_BANNER_VARIANT as 'rainbow' | 'normal') || 'rainbow';

  if (!isEnabled || !text.trim()) {
    return null;
  }

  // Festive celebration fireworks colors for the moving rainbow gradient
  const festiveColors = [
    'rgba(255, 75, 43, 0.85)',   // Sivakasi Festive Red/Orange
    'rgba(255, 185, 0, 0.85)',   // Golden Sparkler
    'rgba(236, 72, 153, 0.8)',   // Festive Magenta
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
      <div className="flex items-center justify-center gap-2 max-w-7xl mx-auto px-4 truncate">
        <Sparkles className="h-3.5 w-3.5 text-amber-300 shrink-0 animate-pulse" />
        <span className="truncate">{text}</span>
        {link && (
          <Link
            href={link}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 hover:text-amber-200 underline underline-offset-2 ml-1 shrink-0 transition-colors"
          >
            <span>Explore</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </Banner>
  );
}
