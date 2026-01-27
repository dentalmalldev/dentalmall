export const locales = ['en', 'ka'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ka';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ka: 'ქართული',
};
