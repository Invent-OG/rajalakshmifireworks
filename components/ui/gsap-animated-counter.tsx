'use client';

import { useRef, useEffect } from 'react';
import { gsap, isReducedMotion } from '@/lib/motion';

interface GsapAnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
}

export function GsapAnimatedCounter({
  value,
  duration = 0.35,
  className = '',
  suffix = '',
}: GsapAnimatedCounterProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const prevValueRef = useRef<number>(value);
  const tweenObjRef = useRef<{ current: number }>({ current: value });

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;

    if (isReducedMotion()) {
      el.textContent = `${Math.round(value)}${suffix}`;
      prevValueRef.current = value;
      return;
    }

    const startVal = prevValueRef.current;
    prevValueRef.current = value;

    const tween = gsap.to(tweenObjRef.current, {
      current: value,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        if (spanRef.current) {
          spanRef.current.textContent = `${Math.round(tweenObjRef.current.current)}${suffix}`;
        }
      },
    });

    if (startVal !== value) {
      gsap.fromTo(
        el,
        { scale: 1.25 },
        { scale: 1, duration: 0.25, ease: 'back.out(2)' }
      );
    }

    return () => {
      tween.kill();
    };
  }, [value, duration, suffix]);

  return (
    <span ref={spanRef} className={`inline-block tabular-nums font-mono ${className}`}>
      {Math.round(value)}{suffix}
    </span>
  );
}

export default GsapAnimatedCounter;
