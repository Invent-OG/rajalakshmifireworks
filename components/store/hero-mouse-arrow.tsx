'use client';

import { useEffect, useRef, useState } from 'react';

export function HeroMouseArrow({
  targetSelector = '#hero-shop-fireworks-btn',
}: {
  targetSelector?: string;
}) {
  const containerRef = useRef<SVGSVGElement>(null);
  const [pathData, setPathData] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);
  const rafId = useRef<number | null>(null);
  const targetPos = useRef<{ x: number; y: number } | null>(null);
  const mousePos = useRef<{ x: number; y: number } | null>(null);
  const smoothMouse = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const svg = containerRef.current;
    if (!svg) return;

    const heroSection = svg.closest('section') || svg.parentElement;
    if (!heroSection) return;

    function getTargetPoint() {
      const targetBtn = document.querySelector(targetSelector);
      if (!targetBtn || !heroSection) return null;

      const heroRect = heroSection.getBoundingClientRect();
      const btnRect = targetBtn.getBoundingClientRect();

      const btnCenterX = btnRect.left - heroRect.left + btnRect.width / 2;
      const btnCenterY = btnRect.top - heroRect.top + btnRect.height / 2;

      return {
        left: btnRect.left - heroRect.left,
        right: btnRect.right - heroRect.left,
        top: btnRect.top - heroRect.top,
        bottom: btnRect.bottom - heroRect.top,
        centerX: btnCenterX,
        centerY: btnCenterY,
      };
    }

    function calculateDockPoint(
      fromX: number,
      fromY: number,
      target: ReturnType<typeof getTargetPoint>
    ) {
      if (!target) return { x: 0, y: 0 };

      // Determine dock position on the perimeter of the button
      const padding = 8;
      if (fromX < target.left) {
        // From left
        return {
          x: target.left - padding,
          y: Math.max(target.top + 8, Math.min(target.bottom - 8, fromY)),
        };
      } else if (fromX > target.right) {
        // From right
        return {
          x: target.right + padding,
          y: Math.max(target.top + 8, Math.min(target.bottom - 8, fromY)),
        };
      } else if (fromY < target.top) {
        // From top
        return {
          x: Math.max(target.left + 12, Math.min(target.right - 12, fromX)),
          y: target.top - padding,
        };
      } else {
        // From bottom
        return {
          x: Math.max(target.left + 12, Math.min(target.right - 12, fromX)),
          y: target.bottom + padding,
        };
      }
    }

    function updateCurve() {
      if (!mousePos.current || !heroSection) return;

      const target = getTargetPoint();
      if (!target) return;

      // Smooth mouse position interpolation (lerp for fluid trailing feel)
      if (!smoothMouse.current) {
        smoothMouse.current = { ...mousePos.current };
      } else {
        smoothMouse.current.x += (mousePos.current.x - smoothMouse.current.x) * 0.25;
        smoothMouse.current.y += (mousePos.current.y - smoothMouse.current.y) * 0.25;
      }

      const startX = smoothMouse.current.x;
      const startY = smoothMouse.current.y;

      const dock = calculateDockPoint(startX, startY, target);
      const endX = dock.x;
      const endY = dock.y;

      const dx = endX - startX;
      const dy = endY - startY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Hide if cursor is directly on top of or too close to the button
      if (distance < 45) {
        setIsVisible(false);
        rafId.current = requestAnimationFrame(updateCurve);
        return;
      }

      setIsVisible(true);

      // Calculate control point for graceful organic arch
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;

      // Calculate perpendicular offset for curve arching
      let curvature = Math.min(80, Math.max(25, distance * 0.22));

      // Arch upward if moving generally horizontally, or curve naturally based on vector
      let ctrlX = midX;
      let ctrlY = midY - curvature;

      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal movement: arch upwards
        ctrlX = midX;
        ctrlY = Math.min(startY, endY) - curvature * 0.6;
      } else {
        // Vertical movement: curve outward
        const sideSign = startX < target.centerX ? -1 : 1;
        ctrlX = midX + sideSign * curvature;
        ctrlY = midY;
      }

      const d = `M ${startX.toFixed(1)} ${startY.toFixed(1)} Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`;
      setPathData(d);

      rafId.current = requestAnimationFrame(updateCurve);
    }

    function handlePointerMove(e: PointerEvent) {
      if (!heroSection) return;
      const heroRect = heroSection.getBoundingClientRect();
      mousePos.current = {
        x: e.clientX - heroRect.left,
        y: e.clientY - heroRect.top,
      };

      if (!rafId.current) {
        rafId.current = requestAnimationFrame(updateCurve);
      }
    }

    function handlePointerLeave() {
      setIsVisible(false);
      mousePos.current = null;
      smoothMouse.current = null;
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    }

    heroSection.addEventListener('pointermove', handlePointerMove);
    heroSection.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      heroSection.removeEventListener('pointermove', handlePointerMove);
      heroSection.removeEventListener('pointerleave', handlePointerLeave);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [targetSelector]);

  return (
    <svg
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full z-20 transition-opacity duration-300 ${
        isVisible && pathData ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <defs>
        <marker
          id="hero-pointer-arrowhead"
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path
            d="M 1 1.5 L 7 5 L 1 8.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-foreground/75"
          />
        </marker>
        <filter id="arrow-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.08" />
        </filter>
      </defs>

      {pathData && (
        <>
          {/* Subtle background track shadow */}
          <path
            d={pathData}
            fill="none"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Main animated dashed curved arrow */}
          <path
            d={pathData}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="6 6"
            strokeLinecap="round"
            markerEnd="url(#hero-pointer-arrowhead)"
            className="text-foreground/75 animate-dash-stream"
            filter="url(#arrow-glow)"
          />
        </>
      )}
    </svg>
  );
}
