'use client';

import { useState, useEffect, useCallback } from 'react';

export type StoreTheme = 'light' | 'dark';

export function getStoreTheme(): StoreTheme {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function applyStoreTheme(theme: StoreTheme) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('theme', theme);
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.setAttribute('data-theme', 'light');
  }
  window.dispatchEvent(new CustomEvent('store-theme-change', { detail: theme }));
}

export function useStoreTheme() {
  const [theme, setThemeState] = useState<StoreTheme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const initialTheme = getStoreTheme();
    setThemeState(initialTheme);

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<StoreTheme>;
      if (customEvent.detail) {
        setThemeState(customEvent.detail);
      } else {
        setThemeState(getStoreTheme());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
        setThemeState(e.newValue);
        if (e.newValue === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.setAttribute('data-theme', 'light');
        }
      }
    };

    window.addEventListener('store-theme-change', handleThemeChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('store-theme-change', handleThemeChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setTheme = useCallback((newTheme: StoreTheme) => {
    setThemeState(newTheme);
    applyStoreTheme(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme, mounted };
}
