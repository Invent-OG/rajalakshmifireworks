'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type StoreButtonVariant =
  | 'primary'
  | 'brand'
  | 'dark'
  | 'secondary'
  | 'outline'
  | 'destructive'
  | 'yellow';

export type StoreButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface StoreButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: StoreButtonVariant;
  size?: StoreButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantClassMap: Record<StoreButtonVariant, string> = {
  primary: 'festive-btn-primary',
  yellow: 'festive-btn-yellow',
  brand: 'festive-btn-brand',
  dark: 'festive-btn-dark',
  secondary: 'festive-btn-secondary',
  outline: 'festive-btn-outline',
  destructive: 'festive-btn-destructive',
};

const sizeClassMap: Record<StoreButtonSize, string> = {
  sm: 'festive-btn-sm',
  md: 'festive-btn-md',
  lg: 'festive-btn-lg',
  icon: 'festive-btn-icon',
};

export const StoreButton = forwardRef<HTMLButtonElement, StoreButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      icon,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(
          'festive-btn select-none',
          variantClassMap[variant] || 'festive-btn-primary',
          sizeClassMap[size] || 'festive-btn-md',
          className
        )}
        {...props}
      >
        <div>
          <span>
            {loading ? (
              <svg
                className="animate-spin h-4 w-4 shrink-0 text-current"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              icon
            )}
            {children}
          </span>
        </div>
      </button>
    );
  }
);

StoreButton.displayName = 'StoreButton';

export default StoreButton;
