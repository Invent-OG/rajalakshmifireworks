'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ArrowUpDown, Check, ChevronDown } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Featured & Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Alphabetical: A to Z' },
] as const;

export function SortSelector({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption =
    SORT_OPTIONS.find((opt) => opt.value === current) || SORT_OPTIONS[0];

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', newSort);
    router.push(`${pathname}?${params.toString()}`);
    setIsOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

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
    <div ref={containerRef} className="relative inline-block text-left">
      {/* Trigger Button - Standardized h-12 Black Button Pattern */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Sort products: currently ${selectedOption.label}`}
        className="h-12 px-5 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm flex items-center justify-between gap-2.5 shadow-xs active:scale-95 transition-all cursor-pointer select-none shrink-0"
      >
        <ArrowUpDown className="h-4 w-4 text-neutral-300 shrink-0" />
        <span className="truncate max-w-[160px] sm:max-w-[200px]">
          {selectedOption.label}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-neutral-300 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Sort options"
          className="absolute right-0 top-full mt-2 w-56 sm:w-60 bg-white rounded-2xl p-1.5 shadow-2xl border border-neutral-200/80 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right overflow-hidden"
        >
          <div className="px-3 py-2 text-[10px] font-bold tracking-wider text-neutral-400 uppercase border-b border-neutral-100">
            Sort Products By
          </div>
          <div className="py-1 space-y-0.5">
            {SORT_OPTIONS.map((option) => {
              const isSelected = option.value === current;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSortChange(option.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-100 text-neutral-950 font-bold'
                      : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950'
                  }`}
                >
                  <span>{option.label}</span>
                  {isSelected && (
                    <Check className="h-4 w-4 text-neutral-950 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
