'use client';

import { useState, useEffect, useCallback } from 'react';

export type AdminTheme = 'light' | 'dark';

export function getAdminTheme(): AdminTheme {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('admin_theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function applyAdminTheme(theme: AdminTheme) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('admin_theme', theme);
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.setAttribute('data-theme', 'light');
  }
  window.dispatchEvent(new CustomEvent('admin-theme-change', { detail: theme }));
}

export function useAdminTheme() {
  const [theme, setThemeState] = useState<AdminTheme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const initialTheme = getAdminTheme();
    setThemeState(initialTheme);

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<AdminTheme>;
      if (customEvent.detail) {
        setThemeState(customEvent.detail);
      } else {
        setThemeState(getAdminTheme());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'admin_theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
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

    window.addEventListener('admin-theme-change', handleThemeChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('admin-theme-change', handleThemeChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setTheme = useCallback((newTheme: AdminTheme) => {
    setThemeState(newTheme);
    applyAdminTheme(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme, mounted };
}
