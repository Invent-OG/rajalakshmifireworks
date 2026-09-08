'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkle, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionTagProps {
  label: string;
  icon?: LucideIcon;
  className?: string;
  size?: 'sm' | 'md';
}

export function SectionTag({
  label,
  icon: Icon = Sparkle,
  className,
  size = 'md',
}: SectionTagProps) {
  const isSm = size === 'sm';

  return (
    <div className={cn('flex items-center gap-1.5 select-none', className)}>
      {/* Circular Rotating Sparkle Badge */}
      <div
        className={cn(
          'rounded-full border border-[#e2e8f1] flex items-center justify-center bg-white overflow-hidden shadow-xs shrink-0',
          isSm ? 'w-9 h-9' : 'w-[44px] h-[44px]'
        )}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          className="flex items-center justify-center"
        >
          <Icon
            size={isSm ? 15 : 18}
            className="text-[#0f162b] fill-[#0f162b]"
          />
        </motion.div>
      </div>

      {/* Pill Tag */}
      <div
        className={cn(
          'rounded-full border border-[#e2e8f1] flex items-center justify-center bg-white shadow-xs',
          isSm ? 'px-3 py-2' : 'px-3 py-2.5 sm:py-3'
        )}
      >
        <span
          className={cn(
            'font-medium text-[#0f162b] px-2 sm:px-3 whitespace-nowrap tracking-tight',
            isSm ? 'text-xs sm:text-sm' : 'text-sm sm:text-[15px]'
          )}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
