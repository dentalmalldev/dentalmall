import { getRequestConfig } from 'next-intl/server';
import { locales } from './config';

// Cleaner failure mode for a missing translation: render the last key segment
// humanized (e.g. "READY FOR DELIVERY") instead of the raw path
// ("orders.status.ready_for_delivery").
export function messageFallback({ key }: { key: string }): string {
  const segment = key.split('.').pop() ?? key;
  return segment.replace(/[_-]/g, ' ').toUpperCase();
}

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !locales.includes(locale as any)) {
    locale = 'ka';
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
    getMessageFallback: messageFallback,
  };
});
