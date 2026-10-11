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
      style={{
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        contain: 'strict',
      }}
    >
      {/* ── 1. Sivakasi Brand Orange Orb (Top-Left) ── */}
      <div
        className="absolute -top-[12%] -left-[8%] w-[480px] sm:w-[680px] h-[480px] sm:h-[680px] rounded-full blur-[45px] sm:blur-[60px] opacity-80 dark:opacity-50 animate-float-slow-1"
        style={{
          background:
            'radial-gradient(circle, rgba(226, 64, 0, 0.40) 0%, rgba(226, 64, 0, 0.16) 45%, transparent 70%)',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
      />

      {/* ── 2. Festive Fireworks Crimson Red Orb (Top-Right) ── */}
      <div
        className="absolute -top-[8%] -right-[10%] w-[450px] sm:w-[650px] h-[450px] sm:h-[650px] rounded-full blur-[45px] sm:blur-[60px] opacity-75 dark:opacity-45 animate-float-slow-2"
        style={{
          background:
            'radial-gradient(circle, rgba(220, 38, 38, 0.38) 0%, rgba(185, 28, 28, 0.14) 45%, transparent 70%)',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
      />

      {/* ── 3. Crisp Pure White Luminous Core (Center-Top) ── */}
      <div
        className="absolute top-[16%] left-[24%] w-[400px] sm:w-[580px] h-[400px] sm:h-[580px] rounded-full blur-[40px] sm:blur-[55px] opacity-85 dark:opacity-20 animate-float-slow-3"
        style={{
          background:
            'radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(255, 240, 235, 0.50) 40%, transparent 70%)',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
      />

      {/* ── 4. Warm Festive Sparkler Golden-Yellow Orb (Floating Mid-Right) ── */}
      <div
        className="absolute top-[38%] -right-[8%] w-[420px] sm:w-[600px] h-[420px] sm:h-[600px] rounded-full blur-[45px] sm:blur-[60px] opacity-75 dark:opacity-35 animate-float-slow-4"
        style={{
          background:
            'radial-gradient(circle, rgba(251, 191, 36, 0.36) 0%, rgba(245, 158, 11, 0.15) 45%, transparent 70%)',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
      />

      {/* ── 5. Rich Fiery Red-Orange Hybrid Orb (Bottom-Left) ── */}
      <div
        className="absolute top-[60%] -left-[10%] w-[460px] sm:w-[660px] h-[460px] sm:h-[660px] rounded-full blur-[45px] sm:blur-[60px] opacity-75 dark:opacity-45 animate-float-slow-1"
        style={{
          background:
            'radial-gradient(circle, rgba(239, 68, 68, 0.34) 0%, rgba(226, 64, 0, 0.18) 45%, transparent 70%)',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          animationDirection: 'reverse',
          animationDuration: '28s',
        }}
      />
    </div>
  );
}
