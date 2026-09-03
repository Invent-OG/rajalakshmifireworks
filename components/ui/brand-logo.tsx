'use client';

import React from 'react';

interface BrandLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

export function BrandLogo({ className = 'h-10 w-auto', ...props }: BrandLogoProps) {
  return (
    <img
      src="/logo.svg"
      alt="Ravana Fireworks"
      className={className}
      loading="eager"
      {...props}
    />
  );
}

export function BrandLogoMark({ className = 'h-8 w-8', ...props }: BrandLogoProps) {
  return (
    <img
      src="/logo.svg"
      alt="Ravana Fireworks Mark"
      className={className}
      loading="eager"
      {...props}
    />
  );
}
