"use client";

import Link from "next/link";
import { StoreButton } from "@/components/ui/store-button";
import { ArrowRight, Sparkles } from "lucide-react";
import { SectionTag } from "@/components/ui/section-tag";
import createGlobe, { COBEOptions } from "cobe";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export default function Featured_05() {
  return (
    <section className="relative w-full mx-auto overflow-hidden rounded-[36px] sm:rounded-[40px] bg-white border-none shadow-sm px-6 py-12 md:px-14 md:py-18">
      <div className="flex flex-col-reverse items-center justify-between gap-10 md:flex-row">
        <div className="z-10 max-w-xl text-left space-y-4">
          <SectionTag label="Sivakasi Supply Network" />

          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
            Lighting Up Celebrations Across{" "}
            <span className="text-neutral-950 font-extrabold">Every Corner of India</span>
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground font-normal leading-relaxed">
            Direct from Sivakasi&apos;s certified manufacturing facilities to your home. Premium handcrafted sparklers, vibrant sound crackers, and grand sky shots with secure nationwide transit.
          </p>

          <div className="pt-2">
            <Link href="/products">
              <StoreButton size="lg" variant="primary">
                Explore Fireworks Collection <ArrowRight className="h-4 w-4" />
              </StoreButton>
            </Link>
          </div>
        </div>

        <div className="relative h-[240px] md:h-[280px] w-full max-w-lg">
          <Globe className="absolute -bottom-16 -right-12 md:-right-24 scale-125 md:scale-140" />
        </div>
      </div>
    </section>
  );
}

// Optimized lightweight markers
const GLOBE_CONFIG: COBEOptions = {
  width: 500,
  height: 500,
  devicePixelRatio: 1.2,
  phi: 1.35, // Centered facing India
  theta: 0.25,
  dark: 0,
  diffuse: 0.4,
  mapSamples: 4000, // Reduced from 16000 for 4x performance boost
  mapBrightness: 1.2,
  baseColor: [1, 1, 1],
  markerColor: [234 / 255, 88 / 255, 12 / 255],
  glowColor: [254 / 255, 240 / 255, 138 / 255],
  markers: [
    { location: [9.4533, 77.7972], size: 0.12 }, // Sivakasi (HQ hub)
    { location: [13.0827, 80.2707], size: 0.08 }, // Chennai
    { location: [12.9716, 77.5946], size: 0.08 }, // Bengaluru
    { location: [17.3850, 78.4867], size: 0.07 }, // Hyderabad
    { location: [19.0760, 72.8777], size: 0.09 }, // Mumbai
    { location: [18.5204, 73.8567], size: 0.06 }, // Pune
    { location: [23.0225, 72.5714], size: 0.07 }, // Ahmedabad
    { location: [28.6139, 77.2090], size: 0.09 }, // Delhi NCR
    { location: [22.5726, 88.3639], size: 0.07 }, // Kolkata
    { location: [9.9312, 76.2673], size: 0.06 },  // Kochi
  ],
};

export function Globe({
  className,
  config = GLOBE_CONFIG,
}: {
  className?: string;
  config?: COBEOptions;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const rotationOffset = useRef(0);
  const [isVisible, setIsVisible] = useState(false);

  // Only animate when visible in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin: "100px" }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const updatePointerInteraction = (value: number | null) => {
    pointerInteracting.current = value;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value !== null ? "grabbing" : "grab";
    }
  };

  const updateMovement = (clientX: number) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current;
      pointerInteractionMovement.current = delta;
      rotationOffset.current = delta / 200;
    }
  };

  useEffect(() => {
    if (!isVisible) return;

    let phi = config.phi ?? 1.35;
    let width = 0;

    const onResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth;
      }
    };

    window.addEventListener("resize", onResize);
    onResize();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const globe = createGlobe(canvas, {
      ...config,
      width: (width || 350) * 1.5,
      height: (width || 350) * 1.5,
    });

    let animationFrameId: number;

    const animate = () => {
      if (!pointerInteracting.current) {
        phi += 0.003;
      }
      globe.update({
        phi: phi + rotationOffset.current,
        width: (width || 350) * 1.5,
        height: (width || 350) * 1.5,
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    if (canvasRef.current) {
      canvasRef.current.style.opacity = "1";
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", onResize);
      globe.destroy();
    };
  }, [config, isVisible]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 mx-auto aspect-[1/1] w-full max-w-[600px]",
        className,
      )}
    >
      <canvas
        className={cn(
          "size-full opacity-0 transition-opacity duration-500 [contain:layout_paint_size]",
        )}
        ref={canvasRef}
        onPointerDown={(e) =>
          updatePointerInteraction(
            e.clientX - pointerInteractionMovement.current,
          )
        }
        onPointerUp={() => updatePointerInteraction(null)}
        onPointerOut={() => updatePointerInteraction(null)}
        onMouseMove={(e) => updateMovement(e.clientX)}
        onTouchMove={(e) =>
          e.touches[0] && updateMovement(e.touches[0].clientX)
        }
      />
    </div>
  );
}
