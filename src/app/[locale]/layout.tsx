import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@/theme";
import { BottomNavigation } from "@/components/layout";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import { LocaleProvider } from './locale-provider';
import { QueryProvider } from '@/providers';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages({ locale });
  const metadata = messages.metadata as { title: string; description: string };

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function LocaleLayout({
  children,
  params
}: Props) {
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages({ locale });

  return (
    <LocaleProvider locale={locale}>
      <NextIntlClientProvider messages={messages}>
        <QueryProvider>
          <AppRouterCacheProvider>
            <ThemeProvider>
              {children}
              <BottomNavigation />
            </ThemeProvider>
          </AppRouterCacheProvider>
        </QueryProvider>
      </NextIntlClientProvider>
    </LocaleProvider>
  );
}
