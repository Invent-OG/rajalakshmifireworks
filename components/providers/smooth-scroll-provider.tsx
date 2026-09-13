'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger, isReducedMotion } from '@/lib/motion';

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (isReducedMotion() || typeof window === 'undefined') return;

    // Initialize Lenis for luxurious buttery smooth scrolling physics
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 1.25,
      wheelMultiplier: 1.0,
      autoRaf: false,
    });

    lenisRef.current = lenis;

    // Synchronize Lenis with GSAP ScrollTrigger
    lenis.on('scroll', () => {
      ScrollTrigger.update();
    });

    const updateTicker = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <>{children}</>;
}
