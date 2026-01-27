'use client';

import { useEffect } from 'react';

export function LocaleProvider({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Set the lang attribute on the html element
    document.documentElement.lang = locale;
  }, [locale]);

  return <>{children}</>;
}
