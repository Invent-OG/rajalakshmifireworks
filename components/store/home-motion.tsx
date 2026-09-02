'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger, isReducedMotion } from '@/lib/motion';

interface HomeMotionProps {
  children: React.ReactNode;
}

export function HomeMotion({ children }: HomeMotionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (isReducedMotion() || !containerRef.current) return;

      // ── 1. Sophisticated Hero Entrance Sequence ───
      const heroTl = gsap.timeline({
        defaults: { ease: 'power3.out', duration: 0.6 },
      });

      heroTl
        .fromTo(
          '.hero-badge',
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.4 }
        )
        .fromTo(
          '.hero-heading',
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 0.55 },
          '-=0.25'
        )
        .fromTo(
          '.hero-text',
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.45 },
          '-=0.3'
        )
        .fromTo(
          '.hero-ctas',
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.4 },
          '-=0.25'
        )
        .fromTo(
          '.hero-signals',
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.35 },
          '-=0.2'
        )
        .fromTo(
          '.hero-showcase',
          { opacity: 0, scale: 0.95, y: 15 },
          { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'power2.out' },
          '-=0.45'
        );

      // Subtle ambient sparkle drift on decorative hero visual
      gsap.to('.hero-sparkle-glow', {
        y: -4,
        scale: 1.05,
        duration: 2.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // ── 2. ScrollTrigger Section Reveals ───
      const scrollSections = gsap.utils.toArray<HTMLElement>('.reveal-section');

      scrollSections.forEach((section) => {
        gsap.fromTo(
          section,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 88%',
              once: true,
            },
          }
        );
      });

      // ── 3. Product Grid Stagger Reveals ───
      const productGrids = gsap.utils.toArray<HTMLElement>('.product-stagger-grid');

      productGrids.forEach((grid) => {
        const cards = grid.children;
        if (!cards.length) return;

        gsap.fromTo(
          cards,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.45,
            stagger: 0.05,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: grid,
              start: 'top 90%',
              once: true,
            },
          }
        );
      });
    },
    { scope: containerRef }
  );

  return <div ref={containerRef}>{children}</div>;
}
