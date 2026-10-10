'use client';

import React from 'react';

export interface BrandLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  imageClassName?: string;
  variant?: 'default' | 'footer' | 'white';
  showText?: boolean;
}

export function BrandLogoMark({
  className = 'h-8 sm:h-9 w-auto',
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src="/logo.svg"
      alt="Rajalakshmi Fireworks"
      className={`object-contain ${className}`}
      loading="eager"
      {...props}
    />
  );
}

export function BrandLogo({
  className = '',
  imageClassName = 'h-7 sm:h-8 md:h-9 w-auto',
  variant = 'default',
  showText = true,
  ...props
}: BrandLogoProps) {
  const isFooter = variant === 'footer' || variant === 'white';

  return (
    <div
      className={`inline-flex flex-col items-center justify-center text-center select-none ${className}`}
      role="img"
      aria-label="Rajalakshmi Fireworks"
      {...props}
    >
      {/* Existing Logo */}
      <img
        src="/logo.svg"
        alt="Rajalakshmi Fireworks"
        className={`object-contain shrink-0 ${imageClassName} ${
          isFooter ? 'brightness-0 invert' : ''
        }`}
        loading="eager"
      />

      {/* Rajalakshmi Fireworks text below the logo */}
      {showText && (
        <div className="flex flex-col items-center justify-center leading-tight text-center mt-0.5">
          <span
            className={`font-black tracking-wider text-[9px] sm:text-[10px] md:text-[11px] uppercase font-sans whitespace-nowrap ${
              isFooter ? 'text-white' : 'text-neutral-950 dark:text-white'
            }`}
          >
            Rajalakshmi Fireworks
          </span>
        </div>
      )}
    </div>
  );
}
