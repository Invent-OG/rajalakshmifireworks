'use client';

import { useState } from 'react';
import { Play, Sparkles, Film, CheckCircle } from 'lucide-react';
import { ProductVisualPlaceholder } from '@/components/ui/category-icon';

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
      <div className="relative aspect-square sm:aspect-4/3 rounded-2xl bg-muted/30 border border-border flex items-center justify-center overflow-hidden">
        {activeMedia ? (
          activeMedia.type === 'video' ? (
            <div className="w-full h-full rounded-xl overflow-hidden bg-black flex items-center justify-center relative">
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
              className="w-full h-full object-cover rounded-xl"
            />
          )
        ) : (
          <ProductVisualPlaceholder name={categoryName || productName} className="w-full h-full text-5xl" />
        )}

        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 pointer-events-none">
          <div className="bg-card/95 backdrop-blur-md px-3 py-1 rounded-full border border-border text-[11px] font-medium text-foreground flex items-center gap-1.5 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            <span>Sivakasi Authentic</span>
          </div>

          {activeMedia?.type === 'video' && (
            <div className="bg-foreground text-background px-3 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 shadow-xs">
              <Play className="h-3 w-3 fill-current" />
              <span>Demo Video</span>
            </div>
          )}
        </div>

        {/* Quick Demo Video Jump Button */}
        {hasDemoVideo && activeMedia?.type !== 'video' && (
          <button
            type="button"
            onClick={handleSelectVideo}
            className="absolute bottom-4 right-4 bg-foreground hover:bg-neutral-800 text-background text-xs font-medium px-3.5 py-2 rounded-xl shadow-sm flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Watch Demo Video</span>
          </button>
        )}
      </div>

      {/* Thumbnails Row */}
      {media.length > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
          {media.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            const isVideo = item.type === 'video';

            return (
              <button
                key={item.id || item.url || idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`
                  relative h-18 w-18 sm:h-20 sm:w-20 rounded-xl border overflow-hidden shrink-0 transition-all cursor-pointer bg-muted/40
                  ${
                    isSelected
                      ? 'border-brand ring-2 ring-brand/20 shadow-xs'
                      : 'border-border hover:border-neutral-400 opacity-80 hover:opacity-100'
                  }
                `}
              >
                {isVideo ? (
                  <div className="w-full h-full bg-neutral-900 flex flex-col items-center justify-center text-white relative">
                    <div className="h-6 w-6 rounded-full bg-brand flex items-center justify-center shadow-xs">
                      <Play className="h-3 w-3 fill-current ml-0.5" />
                    </div>
                    <span className="text-[9px] font-medium mt-1 text-white">Video</span>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt={item.alt || `Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}

                {isVideo && (
                  <span className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full bg-brand flex items-center justify-center">
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
          <CheckCircle className="h-3.5 w-3.5 text-emerald-700" />
          Factory direct sealed packaging
        </span>
        {hasDemoVideo && (
          <span className="text-foreground font-medium flex items-center gap-1">
            <Film className="h-3.5 w-3.5 text-muted-foreground" /> Demo burst video available
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
