'use client';

import React from 'react';

/**
 * FloatingGradientBackground
 * Renders high-performance, GPU-accelerated floating animated gradient orbs
 * combining Sivakasi Brand Orange (#e24000), Festive Red (#dc2626 / #b91c1c),
 * and Crisp White luminous glows behind the home page content.
 */
export function FloatingGradientBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
    >
      {/* ── 1. Sivakasi Brand Orange Orb (Top-Left) ── */}
      <div
        className="absolute -top-[15%] -left-[10%] w-[550px] sm:w-[820px] h-[550px] sm:h-[820px] rounded-full blur-[80px] sm:blur-[130px] opacity-85 dark:opacity-55 animate-float-slow-1 will-change-transform"
        style={{
          background:
            'radial-gradient(circle, rgba(226, 64, 0, 0.42) 0%, rgba(226, 64, 0, 0.16) 50%, transparent 75%)',
        }}
      />

      {/* ── 2. Festive Fireworks Crimson Red Orb (Top-Right) ── */}
      <div
        className="absolute -top-[10%] -right-[12%] w-[520px] sm:w-[780px] h-[520px] sm:h-[780px] rounded-full blur-[80px] sm:blur-[130px] opacity-80 dark:opacity-50 animate-float-slow-2 will-change-transform"
        style={{
          background:
            'radial-gradient(circle, rgba(220, 38, 38, 0.40) 0%, rgba(185, 28, 28, 0.15) 50%, transparent 75%)',
        }}
      />

      {/* ── 3. Crisp Pure White Luminous Core (Center-Top) ── */}
      <div
        className="absolute top-[18%] left-[25%] w-[450px] sm:w-[660px] h-[450px] sm:h-[660px] rounded-full blur-[70px] sm:blur-[110px] opacity-90 dark:opacity-20 animate-float-slow-3 will-change-transform"
        style={{
          background:
            'radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(255, 240, 235, 0.55) 45%, transparent 75%)',
        }}
      />

      {/* ── 4. Fiery Red-Orange Hybrid Blob (Mid-Bottom Left) ── */}
      <div
        className="absolute top-[48%] -left-[14%] w-[540px] sm:w-[800px] h-[540px] sm:h-[800px] rounded-full blur-[90px] sm:blur-[140px] opacity-75 dark:opacity-45 animate-float-slow-4 will-change-transform"
        style={{
          background:
            'radial-gradient(circle, rgba(239, 68, 68, 0.38) 0%, rgba(226, 64, 0, 0.22) 50%, transparent 75%)',
        }}
      />

      {/* ── 5. Rich Deep Festive Red Orb (Bottom-Right) ── */}
      <div
        className="absolute top-[62%] -right-[10%] w-[500px] sm:w-[740px] h-[500px] sm:h-[740px] rounded-full blur-[85px] sm:blur-[130px] opacity-80 dark:opacity-50 animate-float-slow-5 will-change-transform"
        style={{
          background:
            'radial-gradient(circle, rgba(200, 29, 29, 0.38) 0%, rgba(226, 64, 0, 0.16) 50%, transparent 75%)',
        }}
      />

      {/* ── 6. Luminous White, Peach & Soft Yellow Shimmer (Center-Bottom) ── */}
      <div
        className="absolute bottom-[4%] left-[28%] w-[420px] sm:w-[620px] h-[420px] sm:h-[620px] rounded-full blur-[65px] sm:blur-[100px] opacity-85 dark:opacity-20 animate-float-slow-6 will-change-transform"
        style={{
          background:
            'radial-gradient(circle, rgba(255, 255, 255, 0.90) 0%, rgba(254, 240, 138, 0.38) 32%, rgba(254, 215, 170, 0.35) 55%, transparent 75%)',
        }}
      />

      {/* ── 7. Subtle Festive Sparkler Golden-Yellow Orb (Floating Mid-Right) ── */}
      <div
        className="absolute top-[32%] right-[12%] w-[450px] sm:w-[660px] h-[450px] sm:h-[660px] rounded-full blur-[75px] sm:blur-[120px] opacity-75 dark:opacity-35 animate-float-slow-1 will-change-transform"
        style={{
          background:
            'radial-gradient(circle, rgba(251, 191, 36, 0.34) 0%, rgba(245, 158, 11, 0.16) 45%, transparent 70%)',
          animationDirection: 'reverse',
          animationDuration: '24s',
        }}
      />
    </div>
  );
}
