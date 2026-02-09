import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@/theme";
import { BottomNavigation } from "@/components/layout";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import { LocaleProvider } from './locale-provider';
import { QueryProvider, AuthProvider, CartProvider } from '@/providers';

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
  const meta = messages.metadata as { title: string; description: string };

  return {
    title: { default: meta.title, template: `%s | DentalMall` },
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      siteName: 'DentalMall',
      locale: locale === 'ka' ? 'ka_GE' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
    },
    alternates: {
      canonical: `/${locale}`,
      languages: { en: '/en', ka: '/ka' },
    },
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
        <AuthProvider>
          <CartProvider>
            <QueryProvider>
              <AppRouterCacheProvider>
                <ThemeProvider>
                  {children}
                  <BottomNavigation />
                </ThemeProvider>
              </AppRouterCacheProvider>
            </QueryProvider>
          </CartProvider>
        </AuthProvider>
      </NextIntlClientProvider>
    </LocaleProvider>
  );
}
