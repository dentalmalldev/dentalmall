import en from './en.json';
import ka from './ka.json';

export const messages = { en, ka } as const;
export type Messages = typeof en;
