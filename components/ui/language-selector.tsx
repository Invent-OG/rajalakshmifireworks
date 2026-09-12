'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale, useChangeLocale } from '@/lib/i18n/context';
import { LOCALES, LOCALE_LABELS, Locale } from '@/lib/i18n/config';
import { Globe, ChevronDown, Check } from 'lucide-react';

interface LanguageSelectorProps {
  variant?: 'pill' | 'dropdown' | 'inline';
  className?: string;
}

export function LanguageSelector({ variant = 'pill', className = '' }: LanguageSelectorProps) {
  const currentLocale = useLocale();
  const changeLocale = useChangeLocale();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = (locale: Locale) => {
    changeLocale(locale);
    setIsOpen(false);
  };

  if (variant === 'inline') {
    return (
      <div className={`inline-flex items-center gap-1 bg-neutral-100 p-1 rounded-full border border-neutral-200/70 text-xs font-semibold ${className}`}>
        {LOCALES.map((loc) => {
          const isActive = currentLocale === loc;
          return (
            <button
              key={loc}
              type="button"
              onClick={() => handleSelect(loc)}
              className={`px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-neutral-950 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-950 hover:bg-white/80'
              }`}
              aria-pressed={isActive}
              aria-label={`Switch to ${LOCALE_LABELS[loc].name}`}
            >
              {LOCALE_LABELS[loc].short}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative inline-block text-left shrink-0 ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 px-3.5 sm:px-4 rounded-full bg-neutral-100/90 hover:bg-neutral-200/90 text-neutral-800 hover:text-neutral-950 text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border border-neutral-200/60 active:scale-95 select-none"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select language"
      >
        <Globe className="h-4 w-4 text-neutral-500 shrink-0" />
        <span className="font-bold font-sans">
          {LOCALE_LABELS[currentLocale].short}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-neutral-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-neutral-900' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Select language"
          className="absolute right-0 mt-2 w-44 rounded-2xl bg-white text-neutral-900 shadow-xl border border-neutral-200/90 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl"
        >
          {LOCALES.map((loc) => {
            const isActive = currentLocale === loc;
            const label = LOCALE_LABELS[loc];
            return (
              <button
                key={loc}
                role="option"
                aria-selected={isActive}
                type="button"
                onClick={() => handleSelect(loc)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'bg-neutral-100 text-neutral-950 font-bold'
                    : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950'
                }`}
              >
                <div className="flex flex-col">
                  <span className="leading-tight">{label.native}</span>
                  <span className="text-[10px] text-neutral-400 font-normal">{label.name}</span>
                </div>
                {isActive && <Check className="h-4 w-4 text-neutral-950 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
