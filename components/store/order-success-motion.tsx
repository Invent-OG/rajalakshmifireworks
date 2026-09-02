'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, isReducedMotion } from '@/lib/motion';

interface OrderSuccessMotionProps {
  children: React.ReactNode;
}

export function OrderSuccessMotion({ children }: OrderSuccessMotionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (isReducedMotion() || !containerRef.current) return;

      const tl = gsap.timeline({
        defaults: { ease: 'power3.out', duration: 0.5 },
      });

      tl.fromTo(
        '.success-icon',
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.4)' }
      )
        .fromTo(
          '.success-title',
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.4 },
          '-=0.2'
        )
        .fromTo(
          '.success-whatsapp',
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.45 },
          '-=0.25'
        )
        .fromTo(
          '.success-receipt',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5 },
          '-=0.3'
        )
        .fromTo(
          '.success-nav',
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.35 },
          '-=0.2'
        );
    },
    { scope: containerRef }
  );

  return <div ref={containerRef}>{children}</div>;
}
