'use client';

import { useState } from 'react';
import { Play, Sparkles, Film, CheckCircle } from 'lucide-react';

export interface StoreMediaItem {
  id?: number;
  type: 'image' | 'video' | string;
  url: string;
  alt?: string | null;
  sortOrder?: number;
}

interface ProductMediaGalleryProps {
  productName: string;
  categoryName?: string;
  media: StoreMediaItem[];
}

export function ProductMediaGallery({
  productName,
  categoryName,
  media = [],
}: ProductMediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const activeMedia = media[selectedIndex] || null;
  const hasDemoVideo = media.some((m) => m.type === 'video');
  const demoVideoIndex = media.findIndex((m) => m.type === 'video');

  function handleSelectVideo() {
    if (demoVideoIndex !== -1) {
      setSelectedIndex(demoVideoIndex);
    }
  }

  return (
    <div className="space-y-4">
      {/* Main Showcase Viewport */}
      <div className="relative aspect-square sm:aspect-4/3 rounded-3xl bg-gradient-to-b from-muted/60 to-muted/20 border border-border/80 p-4 sm:p-6 flex items-center justify-center luxury-card overflow-hidden">
        {activeMedia ? (
          activeMedia.type === 'video' ? (
            <div className="w-full h-full rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-lg relative">
              {isYoutubeUrl(activeMedia.url) ? (
                <iframe
                  src={getYoutubeEmbedUrl(activeMedia.url)}
                  title={`${productName} Demo Video`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={activeMedia.url}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeMedia.url}
              alt={activeMedia.alt || productName}
              className="w-full h-full object-contain hover:scale-105 transition-transform duration-500 rounded-2xl"
            />
          )
        ) : (
          <div className="text-8xl sm:text-9xl select-none animate-float">
            {getProductCategoryEmoji(categoryName || productName)}
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md px-3 py-1 rounded-full border border-border text-[11px] font-bold text-foreground flex items-center gap-1.5 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-orange-600" />
            <span>Sivakasi Authentic</span>
          </div>

          {activeMedia?.type === 'video' && (
            <div className="bg-orange-600 text-white px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-md animate-pulse">
              <Play className="h-3 w-3 fill-current" />
              <span>Playing Demo Burst Video</span>
            </div>
          )}
        </div>

        {/* Quick Demo Video Jump Button (when viewing photo and video is available) */}
        {hasDemoVideo && activeMedia?.type !== 'video' && (
          <button
            type="button"
            onClick={handleSelectVideo}
            className="absolute bottom-4 right-4 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg shadow-orange-600/30 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Watch Demo Video</span>
          </button>
        )}
      </div>

      {/* Thumbnails Row (when there are 2 or more media items) */}
      {media.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
          {media.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            const isVideo = item.type === 'video';

            return (
              <button
                key={item.id || item.url || idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`
                  relative h-18 w-18 sm:h-20 sm:w-20 rounded-2xl border-2 overflow-hidden shrink-0 transition-all cursor-pointer bg-muted/40
                  ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/30 scale-105 shadow-md'
                      : 'border-border/80 hover:border-primary/50 opacity-80 hover:opacity-100'
                  }
                `}
              >
                {isVideo ? (
                  <div className="w-full h-full bg-stone-900 flex flex-col items-center justify-center text-white relative">
                    <div className="h-7 w-7 rounded-full bg-orange-600 flex items-center justify-center shadow-xs">
                      <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                    </div>
                    <span className="text-[9px] font-bold mt-1 text-amber-200">Video</span>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt={item.alt || `Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Video icon overlay badge */}
                {isVideo && (
                  <span className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full bg-orange-600 flex items-center justify-center">
                    <Film className="h-2 w-2 text-white" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Feature callout */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1 pt-1">
        <span className="flex items-center gap-1.5 font-medium">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
          Factory direct sealed packaging
        </span>
        {hasDemoVideo && (
          <span className="text-orange-600 font-semibold flex items-center gap-1">
            <Film className="h-3.5 w-3.5" /> Demo video available
          </span>
        )}
      </div>
    </div>
  );
}

function isYoutubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

function getYoutubeEmbedUrl(url: string): string {
  try {
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split(/[?#]/)[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
    const urlObj = new URL(url);
    const id = urlObj.searchParams.get('v');
    if (id) {
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
  } catch {
    // fallback
  }
  return url;
}

function getProductCategoryEmoji(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('sparkler')) return '✨';
  if (lower.includes('flower') || lower.includes('pot')) return '🌸';
  if (lower.includes('rocket')) return '🚀';
  if (lower.includes('chakra') || lower.includes('wheel')) return '🎡';
  if (lower.includes('fountain') || lower.includes('cone')) return '⛲';
  if (lower.includes('sound') || lower.includes('bomb') || lower.includes('wala')) return '💥';
  if (lower.includes('gift') || lower.includes('box')) return '🎁';
  if (lower.includes('family') || lower.includes('pack')) return '🎉';
  return '🎆';
}
