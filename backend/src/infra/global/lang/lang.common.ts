import L from '@/infra/i18n/i18n-node';
import type { Locales } from '@/infra/i18n/i18n-types';

export const DEFAULT_LANG: Locales = 'en';
export const AVAILABLE_LANG: Locales[] = ['th', 'en'];

export function getTransaltionFunc(lang: string) {
  if (!lang || !AVAILABLE_LANG.includes(lang as Locales)) {
    return L[DEFAULT_LANG];
  }

  return L[lang];
}
