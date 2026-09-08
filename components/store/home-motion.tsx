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

      // ── 1. Hero Initial Cinematic Entrance ───
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      heroTl
        .fromTo(
          '.hero-heading',
          { opacity: 0, y: 35, filter: 'blur(4px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8 }
        )
        .fromTo(
          '.hero-text',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6 },
          '-=0.45'
        )
        .fromTo(
          '.hero-ctas',
          { opacity: 0, scale: 0.94, y: 15 },
          { opacity: 1, scale: 1, y: 0, duration: 0.55, ease: 'back.out(1.5)' },
          '-=0.35'
        )
        .fromTo(
          '.organic-hero-cards',
          { opacity: 0, x: 25 },
          { opacity: 1, x: 0, duration: 0.7, stagger: 0.12 },
          '-=0.5'
        );

      // ── 2. ScrollTrigger Stagger for Product Grids & Sections ───
      const revealSections = containerRef.current.querySelectorAll('.reveal-section');

      revealSections.forEach((section) => {
        const header = section.querySelector('.section-header');
        const grid = section.querySelector('.product-stagger-grid');

        if (header) {
          gsap.fromTo(
            header,
            { opacity: 0, y: 25 },
            {
              opacity: 1,
              y: 0,
              duration: 0.65,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: section,
                start: 'top 85%',
                toggleActions: 'play none none none',
              },
            }
          );
        }

        if (grid) {
          const cards = grid.children;
          gsap.fromTo(
            cards,
            { opacity: 0, y: 40, scale: 0.96 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.6,
              stagger: 0.08,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: grid,
                start: 'top 88%',
                toggleActions: 'play none none none',
              },
            }
          );
        }
      });
    },
    { scope: containerRef }
  );

  return <div ref={containerRef}>{children}</div>;
}
