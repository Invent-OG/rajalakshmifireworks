'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { useGSAP } from '@gsap/react';

// Register ScrollTrigger & MorphSVGPlugin safely
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, MorphSVGPlugin, useGSAP);
  ScrollTrigger.config({
    ignoreMobileResize: true,
    autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load',
  });
}

export function isReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export { gsap, ScrollTrigger, MorphSVGPlugin, useGSAP };

