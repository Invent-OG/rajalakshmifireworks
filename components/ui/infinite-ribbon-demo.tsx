"use client";

import { InfiniteRibbon } from "@/components/ui/infinite-ribbon";
import { Sparkles, Flame, ShieldCheck, Truck, Gift, Star, Zap } from "lucide-react";

export function InfiniteRibbonPreview() {
  const ribbonText = (
    <span className="inline-flex items-center gap-4 text-sm sm:text-base font-black uppercase tracking-wider">
      <Sparkles className="h-4 w-4" />
      <span>100% Certified Sivakasi Green Crackers</span>
      <span>•</span>
      <Flame className="h-4 w-4" />
      <span>Direct Workshop Wholesale Prices</span>
      <span>•</span>
      <Truck className="h-4 w-4" />
      <span>Safe Nationwide Delivery</span>
      <span>•</span>
      <ShieldCheck className="h-4 w-4" />
      <span>Lab Tested &amp; Approved Quality</span>
      <span>•</span>
      <Gift className="h-4 w-4" />
      <span>Diwali 2026 Celebration Special Combos</span>
      <span>•</span>
      <Zap className="h-4 w-4" />
      <span>120-Shot Aerial Sky Cakes &amp; Sparklers</span>
      <span>•</span>
      <Star className="h-4 w-4 fill-current" />
      <span>25+ Years Of Celebration Trust</span>
      <span>•</span>
    </span>
  );

  return (
    <div className="relative w-full overflow-hidden py-14 sm:py-20 my-2 flex items-center justify-center select-none">
      {/* Background Intersecting Ribbon (Rotated +4.5°) */}
      <div className="absolute w-[120%] -left-[10%] flex items-center justify-center pointer-events-none z-10">
        <InfiniteRibbon
          className="bg-amber-400 text-neutral-950 py-2.5 sm:py-3  font-bold border-y border-amber-500/40"
          duration={120}
          rotation={4.5}
          repeat={4}
        >
          {ribbonText}
        </InfiniteRibbon>
      </div>

      {/* Foreground Intersecting Ribbon (Reverse, Rotated -4.5°) */}
      <div className="w-[120%] -left-[10%] relative flex items-center justify-center pointer-events-none z-20">
        <InfiniteRibbon
          className="bg-neutral-950 text-amber-300 py-2.5 sm:py-3  font-black border-y border-neutral-800"
          duration={120}
          reverse={true}
          rotation={-4.5}
          repeat={4}
        >
          {ribbonText}
        </InfiniteRibbon>
      </div>
    </div>
  );
}

export default InfiniteRibbonPreview;
