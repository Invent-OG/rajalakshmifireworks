export const LOCALES = ['en', 'ta'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_LABELS: Record<Locale, { name: string; short: string; native: string }> = {
  en: {
    name: 'English',
    short: 'EN',
    native: 'English',
  },
  ta: {
    name: 'Tamil',
    short: 'தமிழ்',
    native: 'தமிழ்',
  },
};

export function isValidLocale(locale: string): locale is Locale {
  return LOCALES.includes(locale as Locale);
}
