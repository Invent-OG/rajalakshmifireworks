'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from '@/lib/navigation';
import { Search, X, ChevronDown, Check } from 'lucide-react';
import { useTranslations } from '@/lib/i18n/context';

interface ProductsCatalogToolbarProps {
  currentSort?: string;
  initialSearch?: string;
  placeholder?: string;
  className?: string;
}

export function ProductsCatalogToolbar({
  currentSort = 'newest',
  initialSearch = '',
  placeholder,
  className = '',
}: ProductsCatalogToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('filters');

  const [searchVal, setSearchVal] = useState(initialSearch);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const sortContainerRef = useRef<HTMLDivElement>(null);

  const SORT_OPTIONS = [
    { value: 'newest', label: t('sortNewest') || 'Featured', shortLabel: 'Featured' },
    { value: 'price_asc', label: t('sortPriceLowHigh') || 'Price: Low to High', shortLabel: 'Price: Low' },
    { value: 'price_desc', label: t('sortPriceHighLow') || 'Price: High to Low', shortLabel: 'Price: High' },
    { value: 'name_asc', label: t('sortNameAsc') || 'Name: A to Z', shortLabel: 'Name' },
  ];

  const selectedOption =
    SORT_OPTIONS.find((opt) => opt.value === currentSort) || SORT_OPTIONS[0];

  // Initialize view mode from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('rf_products_view');
      if (saved === 'list' || saved === 'grid') {
        setViewMode(saved);
        applyViewMode(saved);
      }
    } catch (e) {}
  }, []);

  const applyViewMode = (mode: 'grid' | 'list') => {
    const container = document.getElementById('products-grid-container');
    if (!container) return;
    if (mode === 'list') {
      container.classList.add('is-list-view');
      container.classList.remove('grid-cols-2');
      container.classList.add('grid-cols-1');
    } else {
      container.classList.remove('is-list-view');
      container.classList.remove('grid-cols-1');
      container.classList.add('grid-cols-2');
    }
  };

  const handleToggleView = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    try {
      localStorage.setItem('rf_products_view', mode);
    } catch (e) {}
    applyViewMode(mode);
  };

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', newSort);
    router.push(`${pathname}?${params.toString()}`);
    setIsSortOpen(false);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchVal.trim()) {
      params.set('search', searchVal.trim());
    } else {
      params.delete('search');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleClearSearch = () => {
    setSearchVal('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    router.push(`${pathname}?${params.toString()}`);
  };

  // Close sort menu on click outside or escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sortContainerRef.current &&
        !sortContainerRef.current.contains(event.target as Node)
      ) {
        setIsSortOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSortOpen(false);
    };

    if (isSortOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSortOpen]);

  return (
    <div className={`min-w-0 flex items-center justify-start gap-1.5 sm:gap-2.5 py-1 ${className}`}>
      {/* ── 1. Compact Pill Search Input ── */}
      <form onSubmit={handleSearchSubmit} className="relative min-w-0 flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none select-none" />
        <input
          type="text"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          placeholder={placeholder || 'Search fireworks...'}
          className="w-full h-10 pl-9 pr-8 text-xs sm:text-sm rounded-full bg-white dark:bg-[#141414] border border-neutral-200/90 dark:border-[#282828] placeholder:text-neutral-400 text-foreground focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 shadow-2xs transition-all font-sans"
        />
        {searchVal && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </form>

      {/* ── 2. Compact Sort Selector Dropdown ── */}
      <div ref={sortContainerRef} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setIsSortOpen((prev) => !prev)}
          aria-expanded={isSortOpen}
          aria-haspopup="listbox"
          className="h-10 px-3.5 sm:px-4 rounded-2xl sm:rounded-full bg-neutral-100 dark:bg-[#202020] hover:bg-neutral-200/70 dark:hover:bg-[#2a2a2a] text-neutral-800 dark:text-neutral-200 font-semibold text-xs sm:text-sm flex items-center gap-1.5 border border-neutral-200/60 dark:border-[#282828] active:scale-95 transition-all cursor-pointer select-none"
        >
          <span className="truncate max-w-[85px] sm:max-w-[120px]">
            {selectedOption.shortLabel}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400 transition-transform duration-200 shrink-0 ${
              isSortOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isSortOpen && (
          <div
            role="listbox"
            className="absolute right-0 top-full mt-2 w-48 sm:w-56 bg-white dark:bg-[#141414] rounded-2xl p-1.5 shadow-2xl border border-neutral-200/80 dark:border-[#282828] z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right overflow-hidden"
          >
            <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-neutral-400 uppercase border-b border-neutral-100 dark:border-[#282828]">
              {t('sortBy') || 'Sort By'}
            </div>
            <div className="py-1 space-y-0.5">
              {SORT_OPTIONS.map((option) => {
                const isSelected = option.value === currentSort;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSortChange(option.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl flex items-center justify-between transition-colors text-left font-medium ${
                      isSelected
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold'
                        : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#202020]'
                    }`}
                  >
                    <span>{option.label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Grid vs List View Mode Segmented Toggle ── */}
      <div className="h-10 bg-neutral-100 dark:bg-[#202020] p-1 rounded-2xl flex items-center gap-0.5 border border-neutral-200/60 dark:border-[#282828] shrink-0 select-none">
        <button
          type="button"
          onClick={() => handleToggleView('grid')}
          aria-label="Grid view"
          className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            viewMode === 'grid'
              ? 'bg-white dark:bg-[#141414] text-neutral-950 dark:text-white shadow-xs font-bold'
              : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="7" height="7" x="3" y="3" rx="1.5" />
            <rect width="7" height="7" x="14" y="3" rx="1.5" />
            <rect width="7" height="7" x="14" y="14" rx="1.5" />
            <rect width="7" height="7" x="3" y="14" rx="1.5" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => handleToggleView('list')}
          aria-label="List view"
          className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            viewMode === 'list'
              ? 'bg-white dark:bg-[#141414] text-neutral-950 dark:text-white shadow-xs font-bold'
              : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="8" x2="21" y1="6" y2="6" />
            <line x1="8" x2="21" y1="12" y2="12" />
            <line x1="8" x2="21" y1="18" y2="18" />
            <line x1="3" x2="3.01" y1="6" y2="6" />
            <line x1="3" x2="3.01" y1="12" y2="12" />
            <line x1="3" x2="3.01" y1="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
