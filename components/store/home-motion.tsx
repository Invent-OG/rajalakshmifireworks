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

      // Desktop animations (min-width: 768px)
      mm.add('(min-width: 768px)', () => {
        // 1. Initial Hero Entrance Animation
        const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        heroTl
          .fromTo(
            '.hero-heading',
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.75, clearProps: 'transform,opacity' }
          )
          .fromTo(
            '.hero-text',
            { opacity: 0, y: 15 },
            { opacity: 1, y: 0, duration: 0.55, clearProps: 'transform,opacity' },
            '-=0.4'
          )
          .fromTo(
            '.hero-ctas',
            { opacity: 0, scale: 0.95, y: 10 },
            { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'back.out(1.5)', clearProps: 'transform,opacity' },
            '-=0.3'
          );

        // 2. Smooth Scroll Reveal for all subsequent sections
        const allSections = gsap.utils.toArray<HTMLElement>('.reveal-section', containerRef.current);
        const scrollSections = allSections.slice(1);

        scrollSections.forEach((section) => {
          gsap.fromTo(
            section,
            {
              opacity: 0,
              y: 45,
              scale: 0.985,
            },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.95,
              ease: 'power3.out',
              clearProps: 'transform,opacity',
              scrollTrigger: {
                trigger: section,
                start: 'top 88%',
                once: true,
              },
            }
          );
        });
      });

      // Mobile animations (max-width: 767px)
      mm.add('(max-width: 767px)', () => {
        // Mobile hero entrance
        const heroTl = gsap.timeline({ defaults: { ease: 'power2.out' } });
        heroTl.fromTo(
          '.hero-heading, .hero-text, .hero-ctas',
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.55, stagger: 0.1, clearProps: 'transform,opacity' }
        );

        // Mobile smooth scroll reveal for sections
        const allSections = gsap.utils.toArray<HTMLElement>('.reveal-section', containerRef.current);
        const scrollSections = allSections.slice(1);

        scrollSections.forEach((section) => {
          gsap.fromTo(
            section,
            {
              opacity: 0,
              y: 28,
            },
            {
              opacity: 1,
              y: 0,
              duration: 0.75,
              ease: 'power2.out',
              clearProps: 'transform,opacity',
              scrollTrigger: {
                trigger: section,
                start: 'top 90%',
                once: true,
              },
            }
          );
        });
      });

      // Refresh ScrollTrigger once DOM/fonts/images settle
      const timer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 200);

      const handleLoad = () => ScrollTrigger.refresh();
      window.addEventListener('load', handleLoad);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('load', handleLoad);
        mm.revert();
      };
    },
    { scope: containerRef }
  );

  return <div ref={containerRef}>{children}</div>;
}
