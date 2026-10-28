'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  icon?: React.ReactNode;
  ariaLabel?: string;
}

export function CustomDropdown({
  value,
  onChange,
  options,
  placeholder,
  className = '',
  triggerClassName = '',
  menuClassName = '',
  icon,
  ariaLabel,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label || placeholder || value;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn('relative inline-block text-left w-full', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel || displayLabel}
        className={cn(
          'w-full h-10 px-3.5 rounded-full border border-border bg-card hover:bg-muted/40 text-foreground text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 shadow-xs transition-all cursor-pointer select-none active:scale-[0.98]',
          isOpen && 'border-brand ring-2 ring-brand/15',
          triggerClassName
        )}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          {selectedOption?.icon || icon}
          <span className="truncate">{displayLabel}</span>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0',
            isOpen && 'rotate-180 text-foreground'
          )}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label={ariaLabel || displayLabel}
          className={cn(
            'absolute left-0 top-full mt-1.5 min-w-[200px] w-full max-w-xs z-50 bg-card rounded-2xl p-1.5 shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-150 origin-top overflow-hidden',
            menuClassName
          )}
        >
          <div className="max-h-60 overflow-y-auto space-y-0.5 no-scrollbar">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between text-left transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-foreground/85 hover:bg-muted hover:text-foreground'
                  )}
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    {option.icon}
                    <span className="truncate">{option.label}</span>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-primary shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
