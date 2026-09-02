'use client';

import { useRef, useEffect } from 'react';
import { gsap, isReducedMotion } from '@/lib/motion';

interface GsapAnimatedPriceProps {
  value: number;
  prefix?: string;
  duration?: number;
  className?: string;
  animateFlash?: boolean;
}

/**
 * Formats a number with Indian currency formatting (e.g. 1,23,456)
 */
function formatNumberINR(val: number): string {
  const rounded = Math.round(val);
  return new Intl.NumberFormat('en-IN').format(rounded);
}

export function GsapAnimatedPrice({
  value,
  prefix = '₹',
  duration = 0.45,
  className = '',
  animateFlash = true,
}: GsapAnimatedPriceProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const prevValueRef = useRef<number>(value);
  const tweenObjRef = useRef<{ current: number }>({ current: value });

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;

    if (isReducedMotion()) {
      el.textContent = `${prefix}${formatNumberINR(value)}`;
      prevValueRef.current = value;
      return;
    }

    const startVal = prevValueRef.current;
    prevValueRef.current = value;

    // Tween the numeric value smoothly
    const tween = gsap.to(tweenObjRef.current, {
      current: value,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        if (spanRef.current) {
          spanRef.current.textContent = `${prefix}${formatNumberINR(tweenObjRef.current.current)}`;
        }
      },
    });

    // Optional scale & color pop on change if value actually changed
    if (animateFlash && startVal !== value && startVal !== 0) {
      gsap.fromTo(
        el,
        { scale: 1.12, color: value > startVal ? '#15803d' : '#991b1b' },
        { scale: 1, color: 'inherit', duration: 0.35, ease: 'power2.out', delay: 0.05 }
      );
    }

    return () => {
      tween.kill();
    };
  }, [value, prefix, duration, animateFlash]);

  return (
    <span ref={spanRef} className={`inline-block tabular-nums font-mono ${className}`}>
      {prefix}{formatNumberINR(value)}
    </span>
  );
}

export default GsapAnimatedPrice;
