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

      const mm = gsap.matchMedia();

      // Desktop animations: Initial Hero Entrance only
      mm.add('(min-width: 768px)', () => {
        const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        heroTl
          .fromTo(
            '.hero-heading',
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.7, clearProps: 'transform,opacity' }
          )
          .fromTo(
            '.hero-text',
            { opacity: 0, y: 15 },
            { opacity: 1, y: 0, duration: 0.5, clearProps: 'transform,opacity' },
            '-=0.35'
          )
          .fromTo(
            '.hero-ctas',
            { opacity: 0, scale: 0.95, y: 10 },
            { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: 'back.out(1.5)', clearProps: 'transform,opacity' },
            '-=0.25'
          )
          .fromTo(
            '.organic-hero-cards',
            { opacity: 0, x: 20 },
            { opacity: 1, x: 0, duration: 0.6, stagger: 0.1, clearProps: 'transform,opacity' },
            '-=0.35'
          );
      });

      // Mobile animations: Initial Hero Entrance only
      mm.add('(max-width: 767px)', () => {
        const heroTl = gsap.timeline({ defaults: { ease: 'power2.out' } });
        heroTl.fromTo(
          '.hero-heading, .hero-text, .hero-ctas',
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, clearProps: 'all' }
        );
      });

      return () => mm.revert();
    },
    { scope: containerRef }
  );

  return <div ref={containerRef}>{children}</div>;
}
