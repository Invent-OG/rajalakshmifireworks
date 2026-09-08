'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, isReducedMotion } from '@/lib/motion';

interface HomeMotionProps {
  children: React.ReactNode;
}

export function HomeMotion({ children }: HomeMotionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (isReducedMotion() || !containerRef.current) return;

      // Quick smooth hero text entrance
      gsap.fromTo(
        '.hero-heading',
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }
      );
    },
    { scope: containerRef }
  );

  return <div ref={containerRef}>{children}</div>;
}
