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

      // Desktop animations
      mm.add('(min-width: 768px)', () => {
        // 1. Hero Cinematic Entrance
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

        // 2. Section ScrollTriggers
        const revealSections = containerRef.current?.querySelectorAll('.reveal-section');
        revealSections?.forEach((section) => {
          const header = section.querySelector('.section-header');
          const grid = section.querySelector('.product-stagger-grid');
          const bentoGrid = section.querySelector('.grid');

          if (header) {
            gsap.fromTo(
              header,
              { opacity: 0, y: 25 },
              {
                opacity: 1,
                y: 0,
                duration: 0.65,
                ease: 'power2.out',
                clearProps: 'transform,opacity',
                scrollTrigger: {
                  trigger: section,
                  start: 'top 85%',
                  toggleActions: 'play none none none',
                },
              }
            );
          }

          if (grid) {
            gsap.fromTo(
              grid.children,
              { opacity: 0, y: 30 },
              {
                opacity: 1,
                y: 0,
                duration: 0.6,
                stagger: 0.06,
                ease: 'power2.out',
                clearProps: 'transform,opacity',
                scrollTrigger: {
                  trigger: grid,
                  start: 'top 88%',
                  toggleActions: 'play none none none',
                },
              }
            );
          }

          if (bentoGrid && !grid) {
            gsap.fromTo(
              bentoGrid.children,
              { opacity: 0, y: 25 },
              {
                opacity: 1,
                y: 0,
                duration: 0.6,
                stagger: 0.08,
                ease: 'power2.out',
                clearProps: 'transform,opacity',
                scrollTrigger: {
                  trigger: bentoGrid,
                  start: 'top 85%',
                  toggleActions: 'play none none none',
                },
              }
            );
          }
        });
      });

      // Mobile: Lightweight native-first performance
      mm.add('(max-width: 767px)', () => {
        const heroTl = gsap.timeline({ defaults: { ease: 'power2.out' } });
        heroTl.fromTo(
          '.hero-heading, .hero-text, .hero-ctas',
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, clearProps: 'all' }
        );

        const revealSections = containerRef.current?.querySelectorAll('.reveal-section');
        revealSections?.forEach((section) => {
          gsap.fromTo(
            section,
            { opacity: 0, y: 15 },
            {
              opacity: 1,
              y: 0,
              duration: 0.45,
              ease: 'power2.out',
              clearProps: 'all',
              scrollTrigger: {
                trigger: section,
                start: 'top 90%',
                toggleActions: 'play none none none',
              },
            }
          );
        });
      });

      return () => mm.revert();
    },
    { scope: containerRef }
  );

  return <div ref={containerRef}>{children}</div>;
}
