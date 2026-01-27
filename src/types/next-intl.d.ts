import en from '@/i18n/messages/en.json';

type Messages = typeof en;

declare global {
  // Use type safe messages!
  interface IntlMessages extends Messages {}
}
