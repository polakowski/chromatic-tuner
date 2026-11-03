import { getLocales } from 'expo-localization';

export const LANGUAGES = ['en', 'pl'] as const;
export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'en';

/** Nazwy własne — języka nie opisujemy w innym języku. */
export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  pl: 'Polski',
};

export function isLanguage(value: string | null | undefined): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}

/**
 * Język urządzenia, o ile go wspieramy.
 *
 * Czytany raz, przy starcie, jako wartość początkowa ustawienia — późniejszy
 * wybór użytkownika siedzi w AsyncStorage i wygrywa z ustawieniem systemu.
 */
export function detectLanguage(): Language {
  try {
    for (const locale of getLocales()) {
      if (isLanguage(locale.languageCode)) {
        return locale.languageCode;
      }
    }
  } catch {
    // Gdyby platforma nie oddała locale, angielski jest bezpiecznym startem.
  }
  return DEFAULT_LANGUAGE;
}
