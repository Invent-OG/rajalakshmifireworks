import { Locale, DEFAULT_LOCALE, isValidLocale } from './config';
import enMessages from '@/messages/en.json';
import taMessages from '@/messages/ta.json';

type MessagesType = typeof enMessages;

const messagesMap: Record<Locale, MessagesType> = {
  en: enMessages,
  ta: taMessages as unknown as MessagesType,
};

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

function interpolate(text: string, values?: Record<string, string | number>): string {
  if (!values) return text;
  return text.replace(/\{(\w+)\}/g, (_, key) => {
    return values[key] !== undefined ? String(values[key]) : `{${key}}`;
  });
}

export function getTranslations(localeInput: string | undefined, namespace?: string) {
  const locale: Locale = localeInput && isValidLocale(localeInput) ? localeInput : DEFAULT_LOCALE;
  const activeMessages = messagesMap[locale] || messagesMap[DEFAULT_LOCALE];
  const fallbackMessages = messagesMap[DEFAULT_LOCALE];

  return (key: string, values?: Record<string, string | number>): string => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    let value = getNestedValue(activeMessages as unknown as Record<string, unknown>, fullKey);
    if (value === undefined) {
      value = getNestedValue(fallbackMessages as unknown as Record<string, unknown>, fullKey);
    }
    if (typeof value === 'string') {
      return interpolate(value, values);
    }
    return fullKey;
  };
}
