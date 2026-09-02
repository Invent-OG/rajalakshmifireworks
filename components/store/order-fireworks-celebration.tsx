'use client';

import { useRef, useEffect, useState } from 'react';
import { Fireworks, type FireworksHandlers } from '@fireworks-js/react';
import { Sparkles, Volume2, VolumeX } from 'lucide-react';

export function OrderFireworksCelebration() {
  const fireworksRef = useRef<FireworksHandlers>(null);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    // Automatically start fireworks on mount
    if (fireworksRef.current && !fireworksRef.current.isRunning) {
      fireworksRef.current.start();
    }

    // Softly taper down intensity after 8 seconds for a polished feel
    const timer = setTimeout(() => {
      if (fireworksRef.current) {
        fireworksRef.current.updateOptions({
          intensity: 12,
          decay: { min: 0.02, max: 0.04 },
        });
      }
    }, 8000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
      <Fireworks
        ref={fireworksRef}
        className="w-full h-full"
        options={{
          opacity: 0.7,
          acceleration: 1.05,
          friction: 0.97,
          gravity: 1.5,
          particles: 90,
          traceLength: 3,
          traceSpeed: 10,
          explosion: 7,
          intensity: 32,
          flickering: 50,
          lineStyle: 'round',
          hue: { min: 0, max: 360 },
          delay: { min: 25, max: 45 },
          brightness: { min: 50, max: 80 },
          decay: { min: 0.015, max: 0.03 },
          mouse: {
            click: true,
            move: false,
            max: 3,
          },
          sound: {
            enabled: false,
            files: [
              'https://fireworks.js.org/sounds/explosion0.mp3',
              'https://fireworks.js.org/sounds/explosion1.mp3',
              'https://fireworks.js.org/sounds/explosion2.mp3',
            ],
            volume: { min: 4, max: 8 },
          },
        }}
      />
    </div>
  );
}
