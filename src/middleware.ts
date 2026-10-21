import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  // Always open the site in the default locale (Georgian) instead of guessing
  // from the browser's Accept-Language header or a previous visit's cookie.
  // Visitors can still switch to English; the /en prefix keeps them there.
  localeDetection: false,
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
