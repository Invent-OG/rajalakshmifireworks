import { Locale } from './config';

export interface LocalizedEntity {
  name: string;
  nameTa?: string | null;
  description?: string | null;
  descriptionTa?: string | null;
}

/**
 * Get localized entity name with automatic fallback to English
 */
export function getLocalizedName(entity: LocalizedEntity | null | undefined, locale: Locale): string {
  if (!entity) return '';
  if (locale === 'ta' && entity.nameTa && entity.nameTa.trim().length > 0) {
    return entity.nameTa;
  }
  return entity.name || '';
}

/**
 * Get localized entity description with automatic fallback to English
 */
export function getLocalizedDescription(entity: LocalizedEntity | null | undefined, locale: Locale): string {
  if (!entity) return '';
  if (locale === 'ta' && entity.descriptionTa && entity.descriptionTa.trim().length > 0) {
    return entity.descriptionTa;
  }
  return entity.description || '';
}
